import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sunrise, Sun, Sunset, Moon, Cloud, Bell, BellOff, Search, MapPin, Volume2,
  Check, Loader2, Music, Play, Square, Upload, Trash2, Repeat, X, Maximize2,
  Info, BellRing, Map as MapIcon, MoonStar, Timer, Send,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes } from "adhan";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMosques, type DbMosque } from "@/lib/use-mosques";
import { useWebPush } from "@/lib/use-push";
import { useServerFn } from "@tanstack/react-start";
import { sendTestPrayerPush } from "@/lib/push.functions";
import { toast } from "sonner";

const MosqueMap = lazy(() => import("@/components/MosqueMap"));

export const Route = createFileRoute("/prayer-times")({
  head: () => ({
    meta: [
      { title: "Prayer Times — DeenConnect" },
      { name: "description", content: "Live prayer times per mosque, with custom azan tones, per-prayer alerts and a loop preview." },
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
type MethodKey = typeof METHODS[number]["key"];

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
type PrayerKey = (typeof PRAYERS)[number];
type DisplayKey = PrayerKey | "sunrise";

const ICONS: Record<DisplayKey, typeof Sun> = {
  fajr: Moon, sunrise: Sunrise, dhuhr: Sun, asr: Cloud, maghrib: Sunset, isha: Moon,
};
const ARABIC: Record<DisplayKey, string> = {
  fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء",
};

const BUILTIN_TONES = [
  { id: "classic", label: "Classic Azan", url: "/azan.mp3" },
  { id: "deep", label: "Deep Azan (Makkah-style)", url: "/azan-deep.mp3" },
  { id: "bright", label: "Bright Azan (Madinah-style)", url: "/azan-bright.mp3" },
] as const;
type ToneId = string; // "classic" | "deep" | "bright" | "custom"

type Coord = { lat: number; lng: number; label: string };
type PrayerAlerts = Record<PrayerKey, boolean>;
const DEFAULT_ALERTS: PrayerAlerts = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };

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

  // Preferences
  const [defaultCoord, setDefaultCoord] = useState<Coord | null>(null);
  const [method, setMethod] = useState<MethodKey>("NorthAmerica");
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [perPrayer, setPerPrayer] = useState<Partial<Record<PrayerKey, string>>>({});
  const [toneId, setToneId] = useState<ToneId>("classic");
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState(90);
  const [alerts, setAlerts] = useState<PrayerAlerts>(DEFAULT_ALERTS);
  const [quietStart, setQuietStart] = useState<string>("");
  const [quietEnd, setQuietEnd] = useState<string>("");
  const [leadMinutes, setLeadMinutes] = useState<number>(5);

  // UI state
  const [pickerFor, setPickerFor] = useState<"default" | PrayerKey | null>(null);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingTone, setPlayingTone] = useState<ToneId | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const { status: pushStatus, busy: pushBusy, subscribe: enableBackground } = useWebPush();
  const sendTest = useServerFn(sendTestPrayerPush);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Tones (built-in + custom)
  const tones = useMemo(() => {
    const list: { id: ToneId; label: string; url: string; removable?: boolean }[] = [...BUILTIN_TONES];
    if (customUrl) list.push({ id: "custom", label: "My uploaded azan", url: customUrl, removable: true });
    return list;
  }, [customUrl]);
  const currentTone = useMemo(
    () => tones.find((t) => t.id === toneId) ?? tones[0],
    [tones, toneId]
  );

  // Load profile prefs
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("preferred_mosque_id, prayer_mosques, azan_sound, custom_azan_url, azan_volume, prayer_alerts, quiet_hours_start, quiet_hours_end, alert_lead_minutes")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.preferred_mosque_id) setPreferredId(data.preferred_mosque_id);
        if (data.prayer_mosques && typeof data.prayer_mosques === "object") {
          setPerPrayer(data.prayer_mosques as Partial<Record<PrayerKey, string>>);
        }
        if (data.azan_sound) setToneId(data.azan_sound);
        if (data.custom_azan_url) setCustomUrl(data.custom_azan_url);
        if (typeof data.azan_volume === "number") setVolume(data.azan_volume);
        if (data.prayer_alerts && typeof data.prayer_alerts === "object") {
          setAlerts({ ...DEFAULT_ALERTS, ...(data.prayer_alerts as Partial<PrayerAlerts>) });
        }
        // Times come back as "HH:MM:SS"; <input type="time"> wants "HH:MM".
        if (data.quiet_hours_start) setQuietStart(String(data.quiet_hours_start).slice(0, 5));
        if (data.quiet_hours_end) setQuietEnd(String(data.quiet_hours_end).slice(0, 5));
        if (typeof data.alert_lead_minutes === "number") setLeadMinutes(data.alert_lead_minutes);
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

  // IP-based fallback so the picker always loads results, even if the user
  // denies/ignores the browser geolocation prompt.
  const ipFallback = useCallback(async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (!res.ok) throw new Error("ip lookup failed");
      const j = (await res.json()) as { latitude?: number; longitude?: number; city?: string; country_name?: string };
      if (typeof j.latitude === "number" && typeof j.longitude === "number") {
        setDefaultCoord({
          lat: j.latitude,
          lng: j.longitude,
          label: `Approx · ${j.city ?? "your area"}${j.country_name ? `, ${j.country_name}` : ""}`,
        });
        toast.message("Using approximate location", { description: "Share your precise location for better accuracy." });
        return true;
      }
    } catch { /* swallow */ }
    return false;
  }, []);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported — using approximate location");
      void ipFallback();
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDefaultCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "My current location" });
        setLocating(false);
        toast.success("Location detected");
      },
      async (err) => {
        setLocating(false);
        const reasons: Record<number, string> = {
          1: "Location permission was denied. Enable it in your browser settings, or pick a mosque manually.",
          2: "Your device couldn't determine its position right now.",
          3: "Location request timed out.",
        };
        const msg = reasons[err.code] ?? err.message ?? "Could not get location";
        const ok = await ipFallback();
        if (!ok) toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 }
    );
  }, [ipFallback]);

  type ProfilePatch = {
    preferred_mosque_id?: string | null;
    prayer_mosques?: Partial<Record<PrayerKey, string>>;
    azan_sound?: ToneId;
    custom_azan_url?: string | null;
    azan_volume?: number;
    prayer_alerts?: PrayerAlerts;
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
    alert_lead_minutes?: number;
  };
  const persist = async (patch: ProfilePatch) => {
    if (!user) { toast.info("Sign in to save your preferences"); return; }
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.id);
    if (error) toast.error("Could not save preference");
  };

  // Quiet hours helper — supports overnight ranges.
  const isInQuietHours = useCallback((d: Date) => {
    if (!quietStart || !quietEnd) return false;
    const [sh, sm] = quietStart.split(":").map(Number);
    const [eh, em] = quietEnd.split(":").map(Number);
    if (![sh, sm, eh, em].every(Number.isFinite)) return false;
    const cur = d.getHours() * 60 + d.getMinutes();
    const s = sh * 60 + sm; const e = eh * 60 + em;
    if (s === e) return false;
    return s < e ? cur >= s && cur < e : cur >= s || cur < e;
  }, [quietStart, quietEnd]);

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
  const computeForCoord = useCallback((c: Coord | null) => {
    if (!c) return null;
    const params = (CalculationMethod[method] as () => ReturnType<typeof CalculationMethod.NorthAmerica>)();
    const pt = new PrayerTimes(new Coordinates(c.lat, c.lng), new Date(), params);
    return { fajr: pt.fajr, sunrise: pt.sunrise, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha, _sunnah: new SunnahTimes(pt) };
  }, [method]);

  const defaultTimes = useMemo(() => computeForCoord(defaultMosqueCoord), [defaultMosqueCoord, computeForCoord]);

  const perPrayerTimes = useMemo(() => {
    const out: Partial<Record<PrayerKey, { time: Date; coord: Coord | null; mosque: DbMosque | null }>> = {};
    for (const p of PRAYERS) {
      const mosque = perPrayer[p] ? mosques.find((m) => m.id === perPrayer[p]) ?? null : null;
      const c = coordOf(mosque, defaultMosqueCoord);
      const times = computeForCoord(c);
      if (times) out[p] = { time: times[p], coord: c, mosque };
    }
    return out;
  }, [perPrayer, mosques, defaultMosqueCoord, computeForCoord]);

  const next = useMemo(() => {
    if (!defaultTimes) return null;
    const all: { name: DisplayKey; at: Date }[] = [
      { name: "fajr", at: perPrayerTimes.fajr?.time ?? defaultTimes.fajr },
      { name: "sunrise", at: defaultTimes.sunrise },
      { name: "dhuhr", at: perPrayerTimes.dhuhr?.time ?? defaultTimes.dhuhr },
      { name: "asr", at: perPrayerTimes.asr?.time ?? defaultTimes.asr },
      { name: "maghrib", at: perPrayerTimes.maghrib?.time ?? defaultTimes.maghrib },
      { name: "isha", at: perPrayerTimes.isha?.time ?? defaultTimes.isha },
    ];
    return all.find((e) => e.at > now) ?? { name: "fajr" as DisplayKey, at: defaultTimes._sunnah.middleOfTheNight };
  }, [defaultTimes, perPrayerTimes, now]);

  // Nearby + search — picker always shows results
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
    return mosques.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q) ||
      (m.village ?? "").toLowerCase().includes(q) ||
      (m.country ?? "").toLowerCase().includes(q)
    ).slice(0, 20);
  }, [query, mosques]);

  // Foreground prayer alarm scheduler — fires once per prayer per day while app is open.
  useEffect(() => {
    if (!defaultTimes) return;
    const today = now.toDateString();
    for (const p of PRAYERS) {
      if (!alerts[p]) continue;
      const t = perPrayerTimes[p]?.time ?? defaultTimes[p];
      const key = `${today}|${p}|${t.getTime()}`;
      if (firedRef.current.has(key)) continue;
      const diff = t.getTime() - now.getTime();
      if (diff <= 0 && diff > -60_000) {
        firedRef.current.add(key);
        triggerPrayerAlert(p, t);
      }
    }
  }, [now, defaultTimes, perPrayerTimes, alerts]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerPrayerAlert = (p: PrayerKey, t: Date) => {
    const label = p.charAt(0).toUpperCase() + p.slice(1);
    // Try Notification + Service Worker so it shows even if tab is in background
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const title = `🕌 ${label} prayer time`;
      const body = `It is ${fmt(t)} — time for ${label}`;
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((reg) =>
          reg.showNotification(title, { body, tag: `prayer-${p}`, requireInteraction: true })
        ).catch(() => new Notification(title, { body }));
      } else {
        try { new Notification(title, { body }); } catch { /* ignore */ }
      }
    }
    playTone(toneId, { loop: false });
    toast.success(`${label} prayer time`);
  };

  // Azan playback
  const ensureAudio = () => {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  };
  const playTone = async (id: ToneId, opts?: { loop?: boolean }) => {
    const a = ensureAudio();
    const url = tones.find((t) => t.id === id)?.url ?? "/azan.mp3";
    try {
      a.src = url;
      a.loop = !!opts?.loop;
      a.currentTime = 0;
      a.volume = Math.min(1, Math.max(0, volume / 100));
      await a.play();
      setPlayingTone(id);
      a.onended = () => { if (!a.loop) setPlayingTone(null); };
    } catch {
      toast.error("Tap again to allow audio");
    }
  };
  const stopTone = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current.loop = false; }
    setPlayingTone(null);
  };
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.min(1, Math.max(0, volume / 100));
  }, [volume]);

  const chooseTone = async (id: ToneId) => {
    setToneId(id);
    await persist({ azan_sound: id });
    toast.success(`Saved · ${tones.find((t) => t.id === id)?.label}`);
  };

  const toggleAlert = async (p: PrayerKey) => {
    const next = { ...alerts, [p]: !alerts[p] };
    setAlerts(next);
    await persist({ prayer_alerts: next });
    if (next[p] && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const onVolumeCommit = async (v: number) => {
    await persist({ azan_volume: v });
  };

  // Custom azan upload — validate format, size and duration before uploading.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/x-wav", "audio/wave"];
  const ALLOWED_EXTS = ["mp3", "ogg", "wav"];
  const MAX_SIZE = 8 * 1024 * 1024;
  const MIN_DURATION = 5;
  const MAX_DURATION = 240;

  const probeDuration = (file: File) =>
    new Promise<number>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        if (!isFinite(audio.duration) || audio.duration <= 0) reject(new Error("Could not read audio duration"));
        else resolve(audio.duration);
      };
      audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This audio file can't be played")); };
      audio.src = url;
    });

  const handleUpload = async (file: File) => {
    if (!user) return toast.info("Sign in to upload your azan");
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const typeOk = ALLOWED_TYPES.includes(file.type) || (!file.type && ALLOWED_EXTS.includes(ext));
    if (!typeOk) return toast.error("Unsupported format — use MP3, OGG or WAV");
    if (file.size === 0) return toast.error("File is empty");
    if (file.size > MAX_SIZE) return toast.error(`Max file size is 8 MB (yours is ${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    setUploading(true);
    try {
      const duration = await probeDuration(file);
      if (duration < MIN_DURATION) throw new Error(`Audio is too short (${duration.toFixed(1)}s, min ${MIN_DURATION}s)`);
      if (duration > MAX_DURATION) throw new Error(`Audio is too long (${duration.toFixed(0)}s, max ${MAX_DURATION}s)`);
      const safeExt = ALLOWED_EXTS.includes(ext) ? ext : "mp3";
      const path = `${user.id}/azan.${safeExt}`;
      const { error: upErr } = await supabase.storage.from("azan-uploads").upload(path, file, {
        upsert: true, contentType: file.type || `audio/${safeExt}`,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("azan-uploads").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setCustomUrl(url);
      await persist({ custom_azan_url: url });
      toast.success(`Uploaded · ${duration.toFixed(0)}s`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const removeCustom = async () => {
    if (!user || !customUrl) return;
    try {
      // best effort delete; storage keys begin with userId/
      const path = customUrl.split("/azan-uploads/")[1]?.split("?")[0];
      if (path) await supabase.storage.from("azan-uploads").remove([path]);
    } catch { /* ignore */ }
    setCustomUrl(null);
    if (toneId === "custom") {
      setToneId("classic");
      await persist({ azan_sound: "classic", custom_azan_url: null });
    } else {
      await persist({ custom_azan_url: null });
    }
    toast.success("Custom azan removed");
  };

  const greg = mounted
    ? new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";
  const hijri = mounted
    ? new Intl.DateTimeFormat("en-TN-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date()).replace(" AH", "")
    : "";

  const mosqueLabel = (id?: string | null) => {
    if (!id) return null;
    const m = mosques.find((x) => x.id === id);
    return m ? m.name : null;
  };
  const currentMethodLabel = METHODS.find((m) => m.key === method)?.label ?? method;

  // Open picker — also try to auto-locate so nearby populates immediately
  const openPicker = (target: "default" | PrayerKey) => {
    setPickerFor(target); setQuery("");
    if (!defaultMosqueCoord && navigator.geolocation && !locating) useMyLocation();
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
          <button onClick={() => openPicker("default")} className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold hover:text-gold-foreground transition-colors">
            <Search className="h-3.5 w-3.5" /> {preferredMosque ? "Change default" : "Set default mosque"}
          </button>
          {preferredMosque && (
            <button onClick={clearDefault} className="text-xs text-primary-foreground/70 underline">Clear default</button>
          )}
          <button
            onClick={enableBackground}
            disabled={pushBusy || pushStatus === "subscribed" || pushStatus === "unsupported"}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold hover:text-gold-foreground transition-colors disabled:opacity-60"
            title={pushStatus === "unsupported" ? "Push not supported on this device" : "Get alerts even when the app is closed"}
          >
            {pushBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
            {pushStatus === "subscribed" ? "Background alerts on" : "Enable background alerts"}
          </button>
        </div>

        {next && defaultTimes && (
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-gold">Next prayer · in {countdown(next.at, now)}</div>
              <div className="mt-1 font-serif text-3xl capitalize">
                {next.name} · <span className="text-gold">{fmt(next.at)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => playTone(toneId)} className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-gold-foreground hover:opacity-90">
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
              placeholder="Search by mosque name, city, village or country…"
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
          ) : mosques.length > 0 ? (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">All mosques</div>
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
                {mosques.slice(0, 12).map((m) => (
                  <li key={m.id}>
                    <button onClick={() => selectMosque(m.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent/40">
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.village ? `${m.village}, ` : ""}{m.city}, {m.country}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Tip: share your location to sort by distance.</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No mosques have been added yet. Search by name to find one.</p>
          )}
        </div>
      )}

      {/* Prayer grid — with details, countdown and alert toggle */}
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
            const selectedMosqueName = mosqueLabel(perPrayer[p]) ?? defaultMosqueCoord?.label ?? "—";
            const enabled = alerts[p];
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
                <div className={`mt-1 text-xs ${isNext ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  in {countdown(t, now)} · {currentMethodLabel}
                </div>

                <div className={`mt-4 space-y-2 border-t pt-3 text-xs ${isNext ? "border-gold/30" : "border-border"}`}>
                  <div className={`flex items-center justify-between gap-2 ${isNext ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    <span className="truncate">📍 {selectedMosqueName}</span>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => openPicker(p)}
                        className={`rounded-full border px-2.5 py-1 font-semibold transition-colors ${isNext ? "border-gold/50 text-gold hover:bg-gold hover:text-gold-foreground" : "border-border text-foreground hover:bg-accent"}`}
                      >
                        {mosqueLabel(perPrayer[p]) ? "Change" : "Pick"}
                      </button>
                      {mosqueLabel(perPrayer[p]) && (
                        <button onClick={() => clearPerPrayer(p)} className={`underline ${isNext ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAlert(p)}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-1.5 font-semibold transition-colors ${
                      enabled
                        ? (isNext ? "bg-gold text-gold-foreground" : "bg-gradient-emerald text-primary-foreground")
                        : (isNext ? "border border-gold/50 text-gold" : "border border-border text-muted-foreground hover:bg-accent")
                    }`}
                  >
                    {enabled ? <><Bell className="h-3 w-3" /> Alert on</> : <><BellOff className="h-3 w-3" /> Alert off</>}
                  </button>
                  <Link
                    to="/prayer-times/$prayer"
                    params={{ prayer: p }}
                    className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-semibold ${isNext ? "text-gold hover:underline" : "text-secondary hover:underline"}`}
                  >
                    <Info className="h-3 w-3" /> Details
                  </Link>
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
              Pick the azan sound, upload your own, and loop-test before saving.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
              Current · {currentTone?.label}
            </span>
            <button
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent"
            >
              <Maximize2 className="h-3.5 w-3.5" /> Full preview
            </button>
          </div>
        </div>

        {/* Volume */}
        <div className="mt-5 flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <input
            type="range" min={0} max={100} value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            onMouseUp={(e) => onVolumeCommit(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => onVolumeCommit(Number((e.target as HTMLInputElement).value))}
            className="h-2 w-full max-w-sm cursor-pointer accent-secondary"
          />
          <span className="w-10 text-right text-xs text-muted-foreground">{volume}%</span>
          <button
            onClick={() => (playingTone ? stopTone() : playTone(toneId))}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-emerald px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            title="Play the selected tone at this volume so you can verify the level"
          >
            {playingTone ? <><Square className="h-3 w-3" /> Stop test</> : <><Play className="h-3 w-3" /> Test volume</>}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tones.map((tone) => {
            const isActive = toneId === tone.id;
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
                {tone.removable && (
                  <button onClick={removeCustom} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-xs text-destructive hover:underline">
                    <Trash2 className="h-3 w-3" /> Remove upload
                  </button>
                )}
              </div>
            );
          })}

          {/* Upload card */}
          {!customUrl && (
            <div className="rounded-xl border border-dashed border-border bg-background p-4">
              <div className="font-medium">Upload your own</div>
              <p className="mt-1 text-xs text-muted-foreground">MP3, OGG or WAV. Max 8 MB.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.currentTarget.value = ""; }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !user}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-emerald px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                {uploading ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</> : <><Upload className="h-3 w-3" /> Choose audio file</>}
              </button>
              {!user && <p className="mt-2 text-center text-xs text-muted-foreground">Sign in to upload</p>}
            </div>
          )}
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
            onChange={(e) => setMethod(e.target.value as MethodKey)}
            className="h-11 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-secondary"
          >
            {METHODS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Full-screen preview modal */}
      {previewOpen && (
        <PreviewModal
          tone={currentTone}
          volume={volume}
          setVolume={setVolume}
          onVolumeCommit={onVolumeCommit}
          onClose={() => { stopTone(); setPreviewOpen(false); }}
          playTone={playTone}
          stopTone={stopTone}
          playingTone={playingTone}
        />
      )}
    </div>
  );
}

function PreviewModal({
  tone, volume, setVolume, onVolumeCommit, onClose, playTone, stopTone, playingTone,
}: {
  tone: { id: ToneId; label: string; url: string } | undefined;
  volume: number;
  setVolume: (v: number) => void;
  onVolumeCommit: (v: number) => void;
  onClose: () => void;
  playTone: (id: ToneId, opts?: { loop?: boolean }) => void;
  stopTone: () => void;
  playingTone: ToneId | null;
}) {
  const [loop, setLoop] = useState(true);
  const isPlaying = !!tone && playingTone === tone.id;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!tone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-emerald islamic-pattern md:p-12">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-primary/50 p-2 text-gold hover:bg-primary/70">
          <X className="h-4 w-4" />
        </button>
        <div className="text-xs uppercase tracking-[0.25em] text-gold">Azan preview</div>
        <h2 className="mt-2 font-serif text-3xl md:text-4xl">{tone.label}</h2>
        <p className="mt-1 text-sm text-primary-foreground/70">Loop-test before saving so you know exactly what you'll hear at prayer time.</p>

        <div className="mt-8 grid place-items-center">
          <button
            onClick={() => (isPlaying ? stopTone() : playTone(tone.id, { loop }))}
            className="grid h-32 w-32 place-items-center rounded-full bg-gold text-gold-foreground shadow-emerald hover:opacity-90"
          >
            {isPlaying ? <Square className="h-10 w-10" /> : <Play className="h-10 w-10" />}
          </button>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-gold" />
          <input
            type="range" min={0} max={100} value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            onMouseUp={(e) => onVolumeCommit(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => onVolumeCommit(Number((e.target as HTMLInputElement).value))}
            className="h-2 w-full cursor-pointer accent-gold"
          />
          <span className="w-10 text-right text-xs text-gold">{volume}%</span>
        </div>

        <button
          onClick={() => setLoop((v) => !v)}
          className={`mt-4 inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold ${loop ? "bg-gold text-gold-foreground" : "text-gold"}`}
        >
          <Repeat className="h-3.5 w-3.5" /> {loop ? "Looping on" : "Looping off"}
        </button>
      </div>
    </div>
  );
}
