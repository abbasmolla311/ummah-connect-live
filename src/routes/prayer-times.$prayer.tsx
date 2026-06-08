import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes } from "adhan";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, BellOff, MapPin, Volume2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMosques, type DbMosque } from "@/lib/use-mosques";
import { toast } from "sonner";

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
type PrayerKey = (typeof PRAYERS)[number];
const ARABIC: Record<PrayerKey, string> = { fajr: "الفجر", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء" };

const METHODS = [
  { key: "MuslimWorldLeague", label: "Muslim World League" },
  { key: "Egyptian", label: "Egyptian" },
  { key: "Karachi", label: "Karachi" },
  { key: "UmmAlQura", label: "Umm Al-Qura" },
  { key: "Dubai", label: "Dubai" },
  { key: "MoonsightingCommittee", label: "Moonsighting Committee" },
  { key: "NorthAmerica", label: "ISNA (North America)" },
  { key: "Kuwait", label: "Kuwait" },
  { key: "Qatar", label: "Qatar" },
  { key: "Singapore", label: "Singapore" },
  { key: "Turkey", label: "Turkey" },
  { key: "Tehran", label: "Tehran" },
] as const;
type MethodKey = (typeof METHODS)[number]["key"];

export const Route = createFileRoute("/prayer-times/$prayer")({
  parseParams: ({ prayer }) => ({ prayer: prayer as PrayerKey }),
  head: ({ params }) => ({
    meta: [
      { title: `${params.prayer?.charAt(0).toUpperCase()}${params.prayer?.slice(1)} prayer — DeenConnect` },
      { name: "description", content: `Details for ${params.prayer} prayer time, selected mosque and calculation method.` },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-serif text-2xl">Prayer not found</h1>
      <Link to="/prayer-times" className="mt-4 inline-block text-secondary underline">Back to prayer times</Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-serif text-2xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 rounded-full bg-gradient-emerald px-4 py-2 text-sm font-semibold text-primary-foreground">Retry</button>
      </div>
    );
  },
  component: PrayerDetailsPage,
});

function fmt(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}
function countdown(target: Date, now: Date) {
  let ms = target.getTime() - now.getTime();
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function PrayerDetailsPage() {
  const params = Route.useParams() as { prayer: PrayerKey };
  const prayer: PrayerKey = params.prayer;
  const { user } = useAuth();
  const { mosques, loading } = useMosques();

  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [perPrayer, setPerPrayer] = useState<Partial<Record<PrayerKey, string>>>({});
  const [method, setMethod] = useState<MethodKey>("NorthAmerica");
  const [alerts, setAlerts] = useState<Record<PrayerKey, boolean>>({ fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("preferred_mosque_id, prayer_mosques, prayer_alerts")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setPreferredId(data.preferred_mosque_id ?? null);
        if (data.prayer_mosques && typeof data.prayer_mosques === "object") {
          setPerPrayer(data.prayer_mosques as Partial<Record<PrayerKey, string>>);
        }
        if (data.prayer_alerts && typeof data.prayer_alerts === "object") {
          setAlerts({ ...alerts, ...(data.prayer_alerts as Record<PrayerKey, boolean>) });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const mosque: DbMosque | null = useMemo(() => {
    const id = perPrayer[prayer] ?? preferredId;
    if (!id) return null;
    return mosques.find((m) => m.id === id) ?? null;
  }, [mosques, perPrayer, prayer, preferredId]);

  const time = useMemo(() => {
    if (!mosque || mosque.latitude == null || mosque.longitude == null) return null;
    const paramsFn = CalculationMethod[method] as () => ReturnType<typeof CalculationMethod.NorthAmerica>;
    const pt = new PrayerTimes(new Coordinates(mosque.latitude, mosque.longitude), new Date(), paramsFn());
    return { time: pt[prayer], sunnah: new SunnahTimes(pt), all: pt };
  }, [mosque, method, prayer]);

  const toggleAlert = async () => {
    if (!user) return toast.info("Sign in to save alert preferences");
    const next = { ...alerts, [prayer]: !alerts[prayer] };
    setAlerts(next);
    await supabase.from("profiles").update({ prayer_alerts: next }).eq("user_id", user.id);
  };

  if (!PRAYERS.includes(prayer)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-serif text-2xl">Unknown prayer</h1>
        <Link to="/prayer-times" className="mt-4 inline-block text-secondary underline">Back to prayer times</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <Link to="/prayer-times" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All prayer times
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-emerald islamic-pattern md:p-12">
        <div className="text-xs uppercase tracking-[0.25em] text-gold">{prayer} prayer details</div>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h1 className="font-serif text-4xl capitalize md:text-5xl">{prayer}</h1>
          <span className="font-arabic text-3xl text-gold">{ARABIC[prayer]}</span>
        </div>
        {time ? (
          <>
            <div className="mt-6 font-serif text-5xl text-gold">{fmt(time.time)}</div>
            <div className="mt-2 text-sm text-primary-foreground/80">
              in <span className="font-mono">{countdown(time.time, now)}</span>
            </div>
          </>
        ) : (
          <div className="mt-6 text-sm text-primary-foreground/80">
            {loading ? "Loading mosque…" : "Pick a mosque on the prayer times page to see this prayer."}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Mosque</div>
          {mosque ? (
            <>
              <div className="mt-1 font-serif text-lg">{mosque.name}</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {mosque.village ? `${mosque.village}, ` : ""}{mosque.city}, {mosque.country}
              </div>
              <Link to="/mosques/$id" params={{ id: mosque.id }} className="mt-3 inline-block text-xs font-semibold text-secondary underline">
                View mosque
              </Link>
            </>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "No mosque selected for this prayer."}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Calculation method</div>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as MethodKey)}
            className="mt-2 h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-secondary"
          >
            {METHODS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted-foreground">Affects only this preview.</p>
        </div>

        <button
          onClick={toggleAlert}
          className={`flex items-center justify-center gap-2 rounded-2xl border p-5 font-semibold transition-colors sm:col-span-2 ${
            alerts[prayer] ? "border-secondary bg-gradient-emerald text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-accent"
          }`}
        >
          {alerts[prayer] ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          {alerts[prayer] ? "Alerts on for this prayer" : "Alerts off — tap to enable"}
        </button>

        {time && (
          <div className="rounded-2xl border border-border bg-card p-6 sm:col-span-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Today (same mosque)</div>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const).map((k) => (
                <li key={k} className={`rounded-xl border px-3 py-2 ${k === prayer ? "border-secondary bg-accent/30" : "border-border"}`}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                  <div className="font-serif text-lg">{fmt(time.all[k])}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5" /> Last third of night: {fmt(time.sunnah.lastThirdOfTheNight)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
