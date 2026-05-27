import { createFileRoute } from "@tanstack/react-router";
import { Radio, Pause, Play, Volume2, Users, MapPin, Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMosques } from "@/lib/use-mosques";
import { useLiveAudio } from "@/lib/use-livekit";
import { toast } from "sonner";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Azan — DeenConnect" },
      { name: "description", content: "Listen to live azan broadcasting from mosques around the world." },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { mosques, loading } = useMosques();
  const liveMosques = mosques.filter((m) => m.is_live);
  const [active, setActive] = useState("");
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.85);
  const [elapsed, setElapsed] = useState(0);

  const { audioRef, connected, listeners } = useLiveAudio(active || null, playing);

  useEffect(() => {
    if (!active && liveMosques.length > 0) setActive(liveMosques[0].id);
  }, [liveMosques, active]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, audioRef]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return toast.error("Notifications not supported");
    const p = await Notification.requestPermission();
    if (p === "granted") {
      toast.success("Azan alerts enabled");
      new Notification("DeenConnect", { body: "You'll be notified when azan starts.", icon: "/icon-192.png" });
    } else {
      toast.error("Notifications blocked");
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">Loading…</div>;
  }

  const current = liveMosques.find((m) => m.id === active) ?? liveMosques[0];

  if (!current) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl">No live broadcasts right now</h1>
        <p className="mt-3 text-muted-foreground">Check back at the next adhan time, or follow a mosque to be notified.</p>
        <button onClick={enableNotifications} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold">
          <Bell className="h-4 w-4" /> Enable azan alerts
        </button>
      </div>
    );
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 islamic-pattern opacity-40" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-gold/20 bg-primary/30 p-8 text-primary-foreground backdrop-blur-xl md:p-12">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold">
              <span className="h-2 w-2 rounded-full bg-destructive pulse-live" />
              Live broadcasting · Azan in progress
            </div>

            <div className="mt-8">
              {current.arabic_name && <div className="font-arabic text-3xl text-gold">{current.arabic_name}</div>}
              <h1 className="mt-2 font-serif text-4xl md:text-6xl">{current.name}</h1>
              <p className="mt-3 flex items-center gap-2 text-primary-foreground/75">
                <MapPin className="h-4 w-4" /> {current.village ? `${current.village}, ` : ""}{current.city}, {current.country}
              </p>
              {current.imam_name && <p className="mt-1 text-sm text-primary-foreground/60">Imam: {current.imam_name}</p>}
            </div>

            <div className="mt-10 flex items-end justify-center gap-1.5 h-32">
              {Array.from({ length: 40 }).map((_, i) => {
                const h = playing ? 0.3 + Math.abs(Math.sin((i + elapsed) * 0.5)) * 0.7 : 0.15;
                return (
                  <span
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-gold sound-bar"
                    style={{ height: `${h * 100}%`, animationDelay: `${i * 0.04}s`, animationPlayState: playing ? "running" : "paused" }}
                  />
                );
              })}
            </div>

            <div className="mt-10 flex items-center justify-center gap-6">
              <div className="text-sm text-primary-foreground/70 font-mono">{mm}:{ss}</div>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="grid h-20 w-20 place-items-center rounded-full bg-gradient-gold text-gold-foreground shadow-gold transition-transform hover:scale-105"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 translate-x-0.5" />}
              </button>
              <div className="flex items-center gap-2 text-primary-foreground/70">
                <Volume2 className="h-4 w-4" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 accent-gold"
                />
              </div>
            </div>

            <audio ref={audioRef} autoPlay playsInline className="hidden" />

            <div className="mt-8 flex items-center justify-between border-t border-gold/15 pt-5 text-sm">
              <span className="flex items-center gap-2 text-primary-foreground/80">
                <Users className="h-4 w-4 text-gold" />
                {Math.max(listeners - 1, 0).toLocaleString()} live · {current.followers_count.toLocaleString()} followers
              </span>
              <button onClick={enableNotifications} className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
                <Bell className="h-3.5 w-3.5" /> Azan alerts
              </button>
              <span className={`text-xs ${connected ? "text-emerald-400" : "text-gold/70"}`}>
                {connected ? "● LiveKit connected" : "Connecting…"}
              </span>
            </div>
          </div>


          <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-serif text-2xl text-foreground">Other live mosques</h2>
            <p className="text-sm text-muted-foreground">Switch to listen to another live azan.</p>
            <div className="mt-5 flex flex-col gap-3">
              {liveMosques.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setActive(m.id); setElapsed(0); }}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    m.id === current.id
                      ? "border-secondary bg-accent shadow-emerald"
                      : "border-border hover:border-secondary/50 hover:bg-accent/50"
                  }`}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-emerald">
                    <Radio className="h-5 w-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.village ?? m.city} · {m.listeners_count} listening</div>
                  </div>
                  <span className="flex h-2 w-2 shrink-0 rounded-full bg-destructive pulse-live" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
