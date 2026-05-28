import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Returns the VAPID public key the browser uses to subscribe. */
export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) throw new Error("VAPID_PUBLIC_KEY not configured");
  return { publicKey: key };
});

const SubSchema = z.object({
  endpoint: z.string().url().max(2000),
  p256dh: z.string().min(1).max(500),
  auth: z.string().min(1).max(500),
  mosqueId: z.string().uuid().nullable().optional(),
  userAgent: z.string().max(500).optional(),
});

/** Persist a browser push subscription for the signed-in user. */
export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SubSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          mosque_id: data.mosqueId ?? null,
          user_agent: data.userAgent ?? null,
        },
        { onConflict: "endpoint" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SendSchema = z.object({
  mosqueId: z.string().uuid(),
  title: z.string().min(1).max(120).optional(),
  body: z.string().min(1).max(500).optional(),
});

/** Sends an azan push to every follower of the given mosque. Mosque owner only. */
export const sendAzanPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SendSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Verify mosque ownership
    const { data: mosque, error: mErr } = await supabaseAdmin
      .from("mosques")
      .select("id, name, owner_id, city, country")
      .eq("id", data.mosqueId)
      .single();
    if (mErr || !mosque) throw new Error("Mosque not found");
    if (mosque.owner_id !== userId) throw new Error("Not authorised");

    // Collect follower user ids
    const { data: followers } = await supabaseAdmin
      .from("mosque_followers")
      .select("user_id")
      .eq("mosque_id", data.mosqueId);
    const followerIds = (followers ?? []).map((f) => f.user_id);

    // Always include the owner so they see their own alert
    const allUserIds = Array.from(new Set([...followerIds, userId]));
    if (allUserIds.length === 0) return { sent: 0, failed: 0 };

    const { data: subs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", allUserIds);

    if (!subs || subs.length === 0) return { sent: 0, failed: 0 };

    const webpush = (await import("web-push")).default;
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@deenconnect.app",
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );

    const payload = JSON.stringify({
      title: data.title ?? `🕌 Azan — ${mosque.name}`,
      body: data.body ?? `Live azan now from ${mosque.city}, ${mosque.country}`,
      url: "/live",
      mosqueId: mosque.id,
      tag: `azan-${mosque.id}`,
    });

    let sent = 0;
    let failed = 0;
    const expired: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent++;
        } catch (err) {
          failed++;
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) expired.push(s.id);
        }
      }),
    );

    if (expired.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("id", expired);
    }

    return { sent, failed };
  });
