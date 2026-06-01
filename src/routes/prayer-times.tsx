import { createFileRoute } from "@tanstack/react-router";
import { Sunrise, Sun, Sunset, Moon, Cloud, Bell, Search, MapPin, Volume2, Check, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes } from "adhan";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMosques } from "@/lib/use-mosques";
import { toast } from "sonner";

export const Route = createFileRoute("/prayer-times")({
  head: () => ({
    meta: [
      { title: "Prayer Times — DeenConnect" },
      { name: "description", content: "Live prayer times for your mosque or location, with azan playback." },
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

const ICONS = { fajr: Moon, sunrise: Sunrise, dhuhr: Sun, asr: Cloud, maghrib: Sunset, isha: Moon } as const;
const ARABIC = { fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء" } as const;

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

function PrayerTimesPage() {
  const { user } = useAuth();
  const { mosques } = useMosques();
  const [coord, setCoord] = useState<Coord | null>(null);
  const [method, setMethod] = useState<typeof METHODS[number]["key"]>("NorthAmerica");
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [locating, setLocating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load profile preferences
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("preferred_mosque_id, city, country")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.preferred_mosque_id) setPreferredId(data.preferred_mosque_id);
      });
  }, [user]);

  // Resolve coordinates from preferred mosque
  const preferredMosque = useMemo(
    () => mosques.find((m) => m.id === preferredId) ?? null,
    [mosques, preferredId]
  );

  useEffect(() => {
    if (preferredMosque?.latitude && preferredMosque?.longitude) {
      setCoord({
        lat: preferredMosque.latitude,
        lng: preferredMosque.longitude,
        label: `${preferredMosque.name} · ${preferredMosque.city}`,
      });
    }
  }, [preferredMosque]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "My current location" });
        setLocating(false);
        toast.success("Location detected");
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || "Could not get location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const selectMosque = async (mosqueId: string) => {
    setPreferredId(mosqueId);
    setShowPicker(false);
    setQuery("");
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_mosque_id: mosqueId })
        .eq("user_id", user.id);
      if (error) toast.error("Could not save preference");
      else toast.success("Mosque saved");
    } else {
      toast.info("Sign in to save your mosque");
    }
  };

  const clearPreferred = async () => {
    setPreferredId(null);
    if (user) {
      await supabase.from("profiles").update({ preferred_mosque_id: null }).eq("user_id", user.id);
    }
  };

  // Compute prayer times
  const { times, next } = useMemo(() => {
    if (!coord) return { times: null, next: null };
    const params = (CalculationMethod[method] as () => ReturnType<typeof CalculationMethod.NorthAmerica>)();
    const date = new Date();
    const pt = new PrayerTimes(new Coordinates(coord.lat, coord.lng), date, params);
    const sunnah = new SunnahTimes(pt);
    const all = {
      fajr: pt.fajr, sunrise: pt.sunrise, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha,
    };
    const now = new Date();
    const nextEntry = (Object.entries(all) as [keyof typeof ICONS, Date][])
      .find(([, t]) => t > now);
    return {
      times: all,
      next: nextEntry
        ? { name: nextEntry[0], at: nextEntry[1] }
        : { name: "fajr" as const, at: sunnah.middleOfTheNight },
    };
  }, [coord, method]);

  // Nearby mosques (sorted by distance when coord present)
  const nearby = useMemo(() => {
    if (!coord) return [];
    return [...mosques]
      .map((m) => ({ m, d: distanceKm(coord, m) }))
      .filter((x) => isFinite(x.d))
      .sort((a, b) => a.d - b.d)
      .slice(0, 6);
  }, [coord, mosques]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return mosques
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.city.toLowerCase().includes(q) ||
          (m.village ?? "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, mosques]);

  // Azan playback — created in click handler for autoplay policy
  const playAzan = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/azan.mp3");
      audioRef.current.preload = "auto";
    }
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.9;
      await audioRef.current.play();
      toast.success("Playing azan");
    } catch (e) {
      toast.error("Tap again to enable audio");
    }
  };
  const stopAzan = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const hijri = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date()).replace(" AH", "");
  const greg = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
      {/* Hero */}
      <div className="overflow-hidden rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-emerald islamic-pattern md:p-12">
        <div className="text-xs uppercase tracking-[0.25em] text-gold">{greg}</div>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">Today's Prayers</h1>
        <p className="font-arabic mt-2 text-xl text-gold">{hijri}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {coord ? (
            <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-primary/40 px-4 py-2 text-sm backdrop-blur">
              <MapPin className="h-3.5 w-3.5 text-gold" /> {coord.label}
            </div>
          ) : (
            <div className="rounded-full border border-gold/30 bg-primary/40 px-4 py-2 text-sm">
              Choose your mosque or use current location
            </div>
          )}
          <button
            onClick={useMyLocation}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold hover:text-gold-foreground transition-colors"
          >
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            Use my location
          </button>
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold hover:text-gold-foreground transition-colors"
          >
            <Search className="h-3.5 w-3.5" /> {preferredMosque ? "Change mosque" : "Pick a mosque"}
          </button>
          {preferredMosque && (
            <button onClick={clearPreferred} className="text-xs text-primary-foreground/70 underline">
              Clear
            </button>
          )}
        </div>

        {next && times && (
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-gold">Next prayer</div>
              <div className="mt-1 font-serif text-3xl capitalize">
                {next.name} · <span className="text-gold">{fmt(next.at)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={playAzan}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-gold-foreground hover:opacity-90"
              >
                <Volume2 className="h-4 w-4" /> Play azan
              </button>
              <button
                onClick={stopAzan}
                className="rounded-full border border-gold/40 px-4 py-3 text-sm font-semibold text-gold"
              >
                Stop
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Picker panel */}
      {showPicker && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg">Find your mosque</h2>
            <button onClick={() => setShowPicker(false)} className="text-xs text-muted-foreground hover:text-foreground">
              Close
            </button>
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

          {query && (
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {searchResults.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => selectMosque(m.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent/40"
                  >
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.village ? `${m.village}, ` : ""}{m.city}, {m.country}
                      </div>
                    </div>
                    {preferredId === m.id && <Check className="h-4 w-4 text-secondary" />}
                  </button>
                </li>
              ))}
              {searchResults.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No mosque matches "{query}". Try a different name.
                </li>
              )}
            </ul>
          )}

          {!query && nearby.length > 0 && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Nearby</div>
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
                {nearby.map(({ m, d }) => (
                  <li key={m.id}>
                    <button
                      onClick={() => selectMosque(m.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent/40"
                    >
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.village ? `${m.village}, ` : ""}{m.city} · {d.toFixed(1)} km
                        </div>
                      </div>
                      {preferredId === m.id && <Check className="h-4 w-4 text-secondary" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!query && nearby.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Enable location or type a name to find mosques.
            </p>
          )}
        </div>
      )}

      {/* Prayer grid */}
      {times ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.entries(times) as [keyof typeof ICONS, Date][]).map(([name, t]) => {
            const Icon = ICONS[name];
            const isNext = next?.name === name;
            return (
              <div
                key={name}
                className={`rounded-2xl border p-6 transition-all ${
                  isNext ? "border-gold bg-gradient-emerald text-primary-foreground shadow-emerald" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${isNext ? "bg-gold/20 text-gold" : "bg-accent text-primary"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`font-arabic text-2xl ${isNext ? "text-gold" : "text-secondary"}`}>{ARABIC[name]}</span>
                </div>
                <div className={`mt-5 text-xs uppercase tracking-wider ${isNext ? "text-gold" : "text-muted-foreground"}`}>{name}</div>
                <div className="mt-1 font-serif text-4xl">{fmt(t)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          <Bell className="mx-auto mb-3 h-6 w-6" />
          Pick a mosque or share your location to see today's prayer times.
        </div>
      )}

      {/* Method selector */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl">Calculation method</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the method your local mosque follows.
            </p>
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
