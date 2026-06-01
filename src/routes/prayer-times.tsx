import { createFileRoute } from "@tanstack/react-router";
import { Sunrise, Sun, Sunset, Moon, Cloud, Bell, Search, MapPin, Volume2, Check, Loader2, Music, Play, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes } from "adhan";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMosques, type DbMosque } from "@/lib/use-mosques";
import { toast } from "sonner";

export const Route = createFileRoute("/prayer-times")({
  head: () => ({
    meta: [
      { title: "Prayer Times — DeenConnect" },
      { name: "description", content: "Live prayer times per mosque, with a custom azan tone for each alert." },
    ],
  }),
  component: PrayerTimesPage,
});

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

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
type PrayerKey = (typeof PRAYERS)[number];
type DisplayKey = PrayerKey | "sunrise";

const ICONS: Record<DisplayKey, typeof Sun> = {
  fajr: Moon, sunrise: Sunrise, dhuhr: Sun, asr: Cloud, maghrib: Sunset, isha: Moon,
};
const ARABIC: Record<DisplayKey, string> = {
  fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء",
};

const AZAN_TONES = [
  { id: "classic", label: "Classic Azan", url: "/azan.mp3" },
  { id: "deep", label: "Deep Azan (Makkah-style)", url: "/azan-deep.mp3" },
  { id: "bright", label: "Bright Azan (Madinah-style)", url: "/azan-bright.mp3" },
] as const;
type AzanId = (typeof AZAN_TONES)[number]["id"];

type Coord = { lat: number; lng: number; label: string };

function fmt(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function distanceKm(a: Coord, b: { latitude: number | null; longitude: number | null }) {
  if (b.latitude == null || b.longitude == null) return Infinity;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.lat);
  const dLon = toRad(b.longitude - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function coordOf(m: DbMosque | null | undefined, fallback: Coord | null): Coord | null {
  if (m?.latitude != null && m?.longitude != null) {
    return { lat: m.latitude, lng: m.longitude, label: `${m.name} · ${m.city}` };
  }
  return fallback;
}

function PrayerTimesPage() {
  const { user } = useAuth();
  const { mosques } = useMosques();
  const [defaultCoord, setDefaultCoord] = useState<Coord | null>(null);
  const [method, setMethod] = useState<typeof METHODS[number]["key"]>("NorthAmerica");
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [perPrayer, setPerPrayer] = useState<Partial<Record<PrayerKey, string>>>({});
  const [azanId, setAzanId] = useState<AzanId>("classic");
  const [pickerFor, setPickerFor] = useState<"default" | PrayerKey | null>(null);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingTone, setPlayingTone] = useState<AzanId | null>(null);

  useEffect(() => setMounted(true), []);

  // Load profile prefs
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("preferred_mosque_id, prayer_mosques, azan_sound")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.preferred_mosque_id) setPreferredId(data.preferred_mosque_id);
        if (data.prayer_mosques && typeof data.prayer_mosques === "object") {
          setPerPrayer(data.prayer_mosques as Partial<Record<PrayerKey, string>>);
        }
        if (data.azan_sound && AZAN_TONES.some((t) => t.id === data.azan_sound)) {
          setAzanId(data.azan_sound as AzanId);
        }
      });
  }, [user]);

  const preferredMosque = useMemo(
    () => mosques.find((m) => m.id === preferredId) ?? null,
    [mosques, preferredId]
  );
  const defaultMosqueCoord = useMemo(
    () => coordOf(preferredMosque, defaultCoord),
    [preferredMosque, defaultCoord]
  );

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDefaultCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "My current location" });
        setLocating(false);
        toast.success("Location detected");
      },
      (err) => { setLocating(false); toast.error(err.message || "Could not get location"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const persist = async (patch: { preferred_mosque_id?: string | null; prayer_mosques?: Partial<Record<PrayerKey, string>>; azan_sound?: AzanId }) => {
    if (!user) { toast.info("Sign in to save your preferences"); return; }
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.id);
    if (error) toast.error("Could not save preference");
  };

  const selectMosque = async (mosqueId: string) => {
    if (pickerFor === "default") {
      setPreferredId(mosqueId);
      await persist({ preferred_mosque_id: mosqueId });
      toast.success("Default mosque saved");
    } else if (pickerFor) {
      const next = { ...perPrayer, [pickerFor]: mosqueId };
      setPerPrayer(next);
      await persist({ prayer_mosques: next });
      toast.success(`${pickerFor.charAt(0).toUpperCase() + pickerFor.slice(1)} mosque saved`);
    }
    setPickerFor(null);
    setQuery("");
  };

  const clearPerPrayer = async (p: PrayerKey) => {
    const next = { ...perPrayer };
    delete next[p];
    setPerPrayer(next);
    await persist({ prayer_mosques: next });
  };

  const clearDefault = async () => {
    setPreferredId(null);
    await persist({ preferred_mosque_id: null });
  };

  // Compute prayer times per prayer
  const computeForCoord = (c: Coord | null) => {
    if (!c) return null;
    const params = (CalculationMethod[method] as () => ReturnType<typeof CalculationMethod.NorthAmerica>)();
    const pt = new PrayerTimes(new Coordinates(c.lat, c.lng), new Date(), params);
    return { fajr: pt.fajr, sunrise: pt.sunrise, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha, _sunnah: new SunnahTimes(pt) };
  };

  const defaultTimes = useMemo(() => computeForCoord(defaultMosqueCoord), [defaultMosqueCoord, method]);

  const perPrayerTimes = useMemo(() => {
    const out: Partial<Record<PrayerKey, { time: Date; coord: Coord | null; mosque: DbMosque | null }>> = {};
    for (const p of PRAYERS) {
      const mosque = perPrayer[p] ? mosques.find((m) => m.id === perPrayer[p]) ?? null : null;
      const c = coordOf(mosque, defaultMosqueCoord);
      const times = computeForCoord(c);
      if (times) out[p] = { time: times[p], coord: c, mosque };
    }
    return out;
  }, [perPrayer, mosques, defaultMosqueCoord, method]);

  const next = useMemo(() => {
    if (!defaultTimes) return null;
    const now = new Date();
    const all: { name: DisplayKey; at: Date }[] = [
      { name: "fajr", at: perPrayerTimes.fajr?.time ?? defaultTimes.fajr },
      { name: "sunrise", at: defaultTimes.sunrise },
      { name: "dhuhr", at: perPrayerTimes.dhuhr?.time ?? defaultTimes.dhuhr },
      { name: "asr", at: perPrayerTimes.asr?.time ?? defaultTimes.asr },
      { name: "maghrib", at: perPrayerTimes.maghrib?.time ?? defaultTimes.maghrib },
      { name: "isha", at: perPrayerTimes.isha?.time ?? defaultTimes.isha },
    ];
    return all.find((e) => e.at > now) ?? { name: "fajr" as DisplayKey, at: defaultTimes._sunnah.middleOfTheNight };
  }, [defaultTimes, perPrayerTimes]);

  // Nearby + search
  const nearby = useMemo(() => {
    if (!defaultMosqueCoord) return [];
    return [...mosques]
      .map((m) => ({ m, d: distanceKm(defaultMosqueCoord, m) }))
      .filter((x) => isFinite(x.d))
      .sort((a, b) => a.d - b.d)
      .slice(0, 6);
  }, [defaultMosqueCoord, mosques]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return mosques
      .filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        (m.village ?? "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, mosques]);

  // Azan playback — built synchronously inside click handler
  const playTone = async (tone: AzanId) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const url = AZAN_TONES.find((t) => t.id === tone)?.url ?? "/azan.mp3";
    try {
      audioRef.current.src = url;
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.9;
      await audioRef.current.play();
      setPlayingTone(tone);
      audioRef.current.onended = () => setPlayingTone(null);
    } catch {
      toast.error("Tap again to allow audio");
    }
  };
  const stopTone = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPlayingTone(null);
  };
  const chooseTone = async (tone: AzanId) => {
    setAzanId(tone);
    await persist({ azan_sound: tone });
    toast.success(`Saved · ${AZAN_TONES.find((t) => t.id === tone)?.label}`);
  };

  const greg = mounted
    ? new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";
  const hijri = mounted
    ? new Intl.DateTimeFormat("en-TN-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date())
        .replace(" AH", "")
    : "";

  const mosqueLabel = (id?: string | null) => {
    if (!id) return null;
    const m = mosques.find((x) => x.id === id);
    return m ? m.name : null;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
      {/* Hero */}
      <div className="overflow-hidden rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-emerald islamic-pattern md:p-12">
        <div className="text-xs uppercase tracking-[0.25em] text-gold min-h-[1rem]">{greg}</div>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">Today's Prayers</h1>
        <p className="font-arabic mt-2 text-xl text-gold min-h-[1.75rem]">{hijri}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {defaultMosqueCoord ? (
            <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-primary/40 px-4 py-2 text-sm backdrop-blur">
              <MapPin className="h-3.5 w-3.5 text-gold" /> Default: {defaultMosqueCoord.label}
            </div>
          ) : (
            <div className="rounded-full border border-gold/30 bg-primary/40 px-4 py-2 text-sm">
              Choose a default mosque or share location
            </div>
          )}
          <button onClick={useMyLocation} className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold hover:text-gold-foreground transition-colors">
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            Use my location
          </button>
          <button onClick={() => { setPickerFor("default"); setQuery(""); }} className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold hover:text-gold-foreground transition-colors">
            <Search className="h-3.5 w-3.5" /> {preferredMosque ? "Change default" : "Set default mosque"}
          </button>
          {preferredMosque && (
            <button onClick={clearDefault} className="text-xs text-primary-foreground/70 underline">Clear default</button>
          )}
        </div>

        {next && defaultTimes && (
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-gold">Next prayer</div>
              <div className="mt-1 font-serif text-3xl capitalize">
                {next.name} · <span className="text-gold">{fmt(next.at)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => playTone(azanId)} className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-gold-foreground hover:opacity-90">
                <Volume2 className="h-4 w-4" /> Play azan
              </button>
              <button onClick={stopTone} className="rounded-full border border-gold/40 px-4 py-3 text-sm font-semibold text-gold">Stop</button>
            </div>
          </div>
        )}
      </div>

      {/* Picker panel */}
      {pickerFor && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg">
              {pickerFor === "default" ? "Choose your default mosque" : `Choose mosque for ${pickerFor}`}
            </h2>
            <button onClick={() => setPickerFor(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by mosque name, city or village…"
              className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-secondary"
            />
          </div>

          {query ? (
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {searchResults.map((m) => (
                <li key={m.id}>
                  <button onClick={() => selectMosque(m.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent/40">
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.village ? `${m.village}, ` : ""}{m.city}, {m.country}</div>
                    </div>
                  </button>
                </li>
              ))}
              {searchResults.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">No mosque matches "{query}".</li>
              )}
            </ul>
          ) : nearby.length > 0 ? (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Nearby</div>
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
                {nearby.map(({ m, d }) => (
                  <li key={m.id}>
                    <button onClick={() => selectMosque(m.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent/40">
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.village ? `${m.village}, ` : ""}{m.city} · {d.toFixed(1)} km</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Enable location or type a name to find mosques.</p>
          )}
        </div>
      )}

      {/* Prayer grid */}
      {defaultTimes ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Sunrise (informational) */}
          <div className="rounded-2xl border border-border bg-card p-6 opacity-90">
            <div className="flex items-center justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary">
                <Sunrise className="h-5 w-5" />
              </div>
              <span className="font-arabic text-2xl text-secondary">{ARABIC.sunrise}</span>
            </div>
            <div className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">sunrise</div>
            <div className="mt-1 font-serif text-4xl">{fmt(defaultTimes.sunrise)}</div>
          </div>

          {PRAYERS.map((p) => {
            const entry = perPrayerTimes[p];
            const t = entry?.time ?? defaultTimes[p];
            const Icon = ICONS[p];
            const isNext = next?.name === p;
            const selectedMosqueName = mosqueLabel(perPrayer[p]);
            return (
              <div key={p} className={`rounded-2xl border p-6 transition-all ${isNext ? "border-gold bg-gradient-emerald text-primary-foreground shadow-emerald" : "border-border bg-card"}`}>
                <div className="flex items-center justify-between">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${isNext ? "bg-gold/20 text-gold" : "bg-accent text-primary"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`font-arabic text-2xl ${isNext ? "text-gold" : "text-secondary"}`}>{ARABIC[p]}</span>
                </div>
                <div className={`mt-5 text-xs uppercase tracking-wider ${isNext ? "text-gold" : "text-muted-foreground"}`}>{p}</div>
                <div className="mt-1 font-serif text-4xl">{fmt(t)}</div>

                <div className={`mt-4 flex items-center justify-between gap-2 border-t pt-3 text-xs ${isNext ? "border-gold/30" : "border-border"}`}>
                  <span className={`truncate ${isNext ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {selectedMosqueName ? `Mosque: ${selectedMosqueName}` : "Using default mosque"}
                  </span>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => { setPickerFor(p); setQuery(""); }}
                      className={`rounded-full border px-2.5 py-1 font-semibold transition-colors ${isNext ? "border-gold/50 text-gold hover:bg-gold hover:text-gold-foreground" : "border-border text-foreground hover:bg-accent"}`}
                    >
                      {selectedMosqueName ? "Change" : "Pick"}
                    </button>
                    {selectedMosqueName && (
                      <button onClick={() => clearPerPrayer(p)} className={`underline ${isNext ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          <Bell className="mx-auto mb-3 h-6 w-6" />
          Pick a default mosque or share your location to see today's prayer times.
        </div>
      )}

      {/* Azan tone picker */}
      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-xl">
              <Music className="h-5 w-5 text-secondary" /> Azan tone
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick the azan sound that plays for your prayer alerts. Test before saving.
            </p>
          </div>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
            Current · {AZAN_TONES.find((t) => t.id === azanId)?.label}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {AZAN_TONES.map((tone) => {
            const isActive = azanId === tone.id;
            const isPlaying = playingTone === tone.id;
            return (
              <div key={tone.id} className={`rounded-xl border p-4 transition-all ${isActive ? "border-secondary bg-accent/30" : "border-border bg-background"}`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{tone.label}</div>
                  {isActive && <Check className="h-4 w-4 text-secondary" />}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => (isPlaying ? stopTone() : playTone(tone.id))}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"
                  >
                    {isPlaying ? <><Square className="h-3 w-3" /> Stop</> : <><Play className="h-3 w-3" /> Test</>}
                  </button>
                  <button
                    onClick={() => chooseTone(tone.id)}
                    disabled={isActive}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-emerald px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {isActive ? "Selected" : "Use this"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Method selector */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl">Calculation method</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose the method your local mosque follows.</p>
          </div>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className="h-11 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-secondary"
          >
            {METHODS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
