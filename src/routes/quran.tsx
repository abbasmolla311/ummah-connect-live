import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Headphones, Bookmark } from "lucide-react";

export const Route = createFileRoute("/quran")({
  head: () => ({
    meta: [
      { title: "Quran — DeenConnect" },
      { name: "description", content: "Read and listen to the Holy Quran with translations and 7 reciters." },
    ],
  }),
  component: QuranPage,
});

const surahs = [
  { n: 1, name: "Al-Fatihah", arabic: "الفاتحة", verses: 7, meaning: "The Opening" },
  { n: 2, name: "Al-Baqarah", arabic: "البقرة", verses: 286, meaning: "The Cow" },
  { n: 36, name: "Ya-Sin", arabic: "يس", verses: 83, meaning: "Ya Sin" },
  { n: 55, name: "Ar-Rahman", arabic: "الرحمن", verses: 78, meaning: "The Most Merciful" },
  { n: 67, name: "Al-Mulk", arabic: "الملك", verses: 30, meaning: "The Sovereignty" },
  { n: 112, name: "Al-Ikhlas", arabic: "الإخلاص", verses: 4, meaning: "Sincerity" },
];

function QuranPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-secondary">Holy Book</div>
          <h1 className="mt-2 font-serif text-5xl">The Noble Quran</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            114 Surahs · 6,236 verses · 7 reciters · Arabic, English, Urdu, Bengali translations.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-gradient-emerald px-5 py-3 text-sm font-semibold text-primary-foreground shadow-emerald">
              <BookOpen className="h-4 w-4" /> Continue reading
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-accent">
              <Headphones className="h-4 w-4" /> Listen audio
            </button>
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-emerald p-8 text-primary-foreground shadow-emerald islamic-pattern">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Verse of the day</div>
          <p className="font-arabic mt-6 text-right text-3xl text-gold leading-relaxed">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
          <p className="mt-4 font-serif text-xl">"In the name of Allah, the Most Gracious, the Most Merciful."</p>
        </div>
      </div>

      <h2 className="mt-16 font-serif text-2xl">Popular surahs</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {surahs.map((s) => (
          <div key={s.n} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-emerald cursor-pointer">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-gold font-serif text-lg text-gold-foreground">
              {s.n}
            </div>
            <div className="flex-1">
              <div className="font-serif text-lg text-foreground">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.meaning} · {s.verses} verses</div>
            </div>
            <div className="font-arabic text-2xl text-secondary">{s.arabic}</div>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Full Quran content with audio playback will load from the Lovable Cloud database — enable it to activate.
      </div>
    </div>
  );
}
