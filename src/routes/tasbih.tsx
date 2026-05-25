import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CircleDot, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/tasbih")({
  head: () => ({
    meta: [
      { title: "Digital Tasbih — DeenConnect" },
      { name: "description", content: "A digital tasbih counter for dhikr with target tracking and daily history, saved to your account." },
    ],
  }),
  component: TasbihPage,
});

const ZIKRS = [
  { arabic: "سُبْحَانَ ٱللَّٰه", english: "SubhanAllah" },
  { arabic: "ٱلْحَمْدُ لِلَّٰه", english: "Alhamdulillah" },
  { arabic: "ٱللَّٰهُ أَكْبَر", english: "Allahu Akbar" },
  { arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰه", english: "La ilaha illa Allah" },
  { arabic: "أَسْتَغْفِرُ ٱللَّٰه", english: "Astaghfirullah" },
];

function TasbihPage() {
  const [zikrIdx, setZikrIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [history, setHistory] = useState<Array<{ zikr: string; count: number; session_date: string }>>([]);
  const { user } = useAuth();
  const zikr = ZIKRS[zikrIdx];

  useEffect(() => {
    if (!user) return;
    supabase.from("tasbih_sessions").select("zikr,count,session_date").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(20)
      .then(({ data }) => setHistory((data ?? []) as typeof history));
  }, [user]);

  const tap = () => {
    const next = count + 1;
    setCount(next);
    if (typeof navigator.vibrate === "function") navigator.vibrate(10);
    if (next === target) toast.success(`Target reached: ${zikr.english} × ${target}`);
  };

  const reset = () => setCount(0);

  const save = async () => {
    if (!user) { toast.error("Sign in to save tasbih"); return; }
    if (count === 0) return;
    const { error } = await supabase.from("tasbih_sessions").insert({
      user_id: user.id, zikr: zikr.english, count, target, session_date: new Date().toISOString().slice(0, 10),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Session saved");
    setCount(0);
    const { data } = await supabase.from("tasbih_sessions").select("zikr,count,session_date").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(20);
    setHistory((data ?? []) as typeof history);
  };

  const progress = Math.min(count / target, 1);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 md:py-16 text-center">
      <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-emerald shadow-emerald">
        <CircleDot className="h-7 w-7 text-gold" />
      </div>
      <h1 className="font-serif text-4xl text-foreground">Digital Tasbih</h1>
      <p className="mt-2 text-muted-foreground">Tap to count, save to your daily history</p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {ZIKRS.map((z, i) => (
          <button
            key={z.english}
            onClick={() => { setZikrIdx(i); setCount(0); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${i === zikrIdx ? "bg-gradient-emerald text-gold shadow-emerald" : "border border-border text-foreground hover:bg-accent"}`}
          >{z.english}</button>
        ))}
      </div>

      <button
        onClick={tap}
        className="relative mx-auto mt-10 grid h-72 w-72 select-none place-items-center rounded-full bg-gradient-emerald shadow-emerald transition-transform active:scale-95"
      >
        <svg className="absolute inset-0" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--gold) / 0.15)" strokeWidth="4" />
          <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--gold))" strokeWidth="4"
            strokeDasharray={`${progress * 289} 289`} strokeLinecap="round" transform="rotate(-90 50 50)" />
        </svg>
        <div className="relative">
          <div className="font-arabic text-3xl text-gold">{zikr.arabic}</div>
          <div className="mt-3 font-serif text-7xl font-bold text-primary-foreground">{count}</div>
          <div className="mt-1 text-xs uppercase tracking-widest text-primary-foreground/70">target {target}</div>
        </div>
      </button>

      <div className="mt-6 flex items-center justify-center gap-3">
        <label className="text-sm text-muted-foreground">Target</label>
        <select value={target} onChange={(e) => setTarget(Number(e.target.value))}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
          {[33, 99, 100, 500, 1000].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
        <button onClick={save} className="rounded-full bg-gradient-gold px-5 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
          Save
        </button>
      </div>

      {user && history.length > 0 && (
        <div className="mt-12 text-left">
          <h2 className="mb-3 font-serif text-xl text-foreground">Recent sessions</h2>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                <span className="text-sm font-medium text-foreground">{h.zikr}</span>
                <span className="text-sm text-muted-foreground">{h.count} · {h.session_date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
