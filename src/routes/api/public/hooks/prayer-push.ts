import { createFileRoute } from "@tanstack/react-router";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
const PRAYERS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

type Mosque = { id: string; name: string; city: string; latitude: number | null; longitude: number | null };

// Scheduled hook — pg_cron hits this every minute. Computes today's prayer times per user from their
// preferred / per-prayer mosques and fires a web push when a prayer is due in the next 2 minutes.
export const Route = createFileRoute("/api/public/hooks/prayer-push")({
  server: {
    handlers: {
      POST: async () => {
        const startedAt = new Date();
        try {
          const [{ data: profiles }, { data: subs }, { data: mosques }] = await Promise.all([
            supabaseAdmin
              .from("profiles")
              .select("user_id, preferred_mosque_id, prayer_mosques, prayer_alerts, azan_sound, quiet_hours_start, quiet_hours_end, alert_lead_minutes"),
            supabaseAdmin.from("push_subscriptions").select("user_id, endpoint, p256dh, auth"),
            supabaseAdmin.from("mosques").select("id, name, city, latitude, longitude"),
          ]);
          if (!profiles || !subs || !mosques) {
            return Response.json({ ok: true, processed: 0, sent: 0 });
          }

          const subsByUser = new Map<string, typeof subs>();
          for (const s of subs) {
            const arr = subsByUser.get(s.user_id) ?? [];
            arr.push(s);
            subsByUser.set(s.user_id, arr);
          }
          const mosqueById = new Map<string, Mosque>(mosques.map((m) => [m.id, m as Mosque]));

          const todayISO = startedAt.toISOString().slice(0, 10);
          const { data: alreadyFired } = await supabaseAdmin
            .from("prayer_alert_log")
            .select("user_id, prayer")
            .eq("fired_for", todayISO);
          const firedSet = new Set((alreadyFired ?? []).map((r) => `${r.user_id}|${r.prayer}`));

          const webpush = (await import("web-push")).default;
          webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || "mailto:admin@deenconnect.app",
            process.env.VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!,
          );

          const params = CalculationMethod.MuslimWorldLeague();
          let sent = 0;
          const expired: string[] = [];
          const logRows: { user_id: string; prayer: string; fired_for: string }[] = [];

          // Quiet-hours helper: supports overnight ranges (22:00 → 06:00).
          const parseHm = (v: string | null | undefined): { h: number; m: number } | null => {
            if (!v) return null;
            const [hStr, mStr] = v.split(":");
            const h = Number(hStr); const m = Number(mStr);
            if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
            return { h, m };
          };
          const isQuiet = (d: Date, start: string | null, end: string | null) => {
            const s = parseHm(start); const e = parseHm(end);
            if (!s || !e) return false;
            const cur = d.getHours() * 60 + d.getMinutes();
            const sm = s.h * 60 + s.m; const em = e.h * 60 + e.m;
            if (sm === em) return false;
            return sm < em ? cur >= sm && cur < em : cur >= sm || cur < em;
          };

          for (const profile of profiles) {
            const userSubs = subsByUser.get(profile.user_id);
            if (!userSubs || userSubs.length === 0) continue;
            const alerts = (profile.prayer_alerts as Partial<Record<PrayerKey, boolean>>) ?? {};
            const perPrayer = (profile.prayer_mosques as Partial<Record<PrayerKey, string>>) ?? {};
            const defaultMosque = profile.preferred_mosque_id ? mosqueById.get(profile.preferred_mosque_id) : null;
            const leadMin = Math.max(0, Math.min(60, Number(profile.alert_lead_minutes ?? 5)));

            for (const p of PRAYERS) {
              if (alerts[p] === false) continue;
              if (firedSet.has(`${profile.user_id}|${p}`)) continue;
              const mosque = perPrayer[p] ? mosqueById.get(perPrayer[p]!) : defaultMosque;
              if (!mosque || mosque.latitude == null || mosque.longitude == null) continue;
              const pt = new PrayerTimes(new Coordinates(mosque.latitude, mosque.longitude), startedAt, params);
              const t = pt[p];
              const diffMs = t.getTime() - startedAt.getTime();
              // Fire when prayer is within the user's chosen lead window (cron runs every minute).
              const windowMs = (leadMin + 1) * 60_000;
              if (diffMs > windowMs || diffMs < -60_000) continue;
              // Skip during user-configured quiet hours.
              if (isQuiet(startedAt, profile.quiet_hours_start as string | null, profile.quiet_hours_end as string | null)) continue;


              const label = p.charAt(0).toUpperCase() + p.slice(1);
              const payload = JSON.stringify({
                title: `🕌 ${label} prayer time`,
                body: `${mosque.name} · ${mosque.city}`,
                url: `/prayer-times/${p}`,
                tag: `prayer-${p}-${todayISO}`,
              });
              await Promise.all(
                userSubs.map(async (s) => {
                  try {
                    await webpush.sendNotification(
                      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                      payload,
                    );
                    sent++;
                  } catch (err) {
                    const status = (err as { statusCode?: number })?.statusCode;
                    if (status === 404 || status === 410) expired.push(s.endpoint);
                  }
                }),
              );
              logRows.push({ user_id: profile.user_id, prayer: p, fired_for: todayISO });
            }
          }

          if (logRows.length > 0) {
            await supabaseAdmin
              .from("prayer_alert_log")
              .upsert(logRows, { onConflict: "user_id,prayer,fired_for" });
          }
          if (expired.length > 0) {
            await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", expired);
          }

          return Response.json({ ok: true, profiles: profiles.length, sent });
        } catch (e) {
          console.error("prayer-push failed", e);
          return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
