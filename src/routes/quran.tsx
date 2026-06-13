import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Bookmark, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/quran")({
  head: () => ({
    meta: [
      { title: "Quran — DeenConnect" },
      { name: "description", content: "Read the Holy Quran in Arabic with English and Bengali translation, surah by surah." },
    ],
  }),
  component: QuranPage,
});

type Surah = { number: number; name: string; englishName: string; englishNameTranslation: string; numberOfAyahs: number; revelationType: string };
type Ayah = { number: number; numberInSurah: number; text: string };

function QuranPage() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [active, setActive] = useState<number>(1);
  const [arabic, setArabic] = useState<Ayah[]>([]);
  const [translated, setTranslated] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  useEffect(() => {
    fetch("https://api.alquran.cloud/v1/surah")
      .then((r) => r.json())
      .then((d) => setSurahs(d.data ?? []))
      .catch(() => toast.error(t("quran.loadFail")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLoading(true);
    const translation = lang === "bn" ? "bn.bengali" : "en.sahih";
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${active}/quran-uthmani`).then((r) => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${active}/${translation}`).then((r) => r.json()),
    ])
      .then(([a, e]) => { setArabic(a.data?.ayahs ?? []); setTranslated(e.data?.ayahs ?? []); })
      .catch(() => toast.error(t("quran.loadFail")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, lang]);

  useEffect(() => {
    if (!user) { setBookmarks(new Set()); return; }
    supabase.from("bookmarks").select("ref_key").eq("kind", "ayah").eq("user_id", user.id)
      .then(({ data }) => setBookmarks(new Set(((data ?? []) as { ref_key: string }[]).map((b) => b.ref_key))));
  }, [user]);

  const toggleBookmark = async (surahNum: number, ayahNum: number, label: string) => {
    if (!user) { toast.error(t("common.signInToBookmark")); return; }
    const refKey = `${surahNum}:${ayahNum}`;
    if (bookmarks.has(refKey)) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("kind", "ayah").eq("ref_key", refKey);
      setBookmarks((s) => { const n = new Set(s); n.delete(refKey); return n; });
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, kind: "ayah", ref_key: refKey, label });
      setBookmarks((s) => new Set(s).add(refKey));
      toast.success(t("quran.bookmarked"));
    }
  };

  const currentSurah = surahs.find((s) => s.number === active);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-emerald shadow-emerald">
          <BookOpen className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">The Holy Quran</h1>
          <p className="text-sm text-muted-foreground">Arabic · English (Sahih International)</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-border bg-card p-3 lg:max-h-[80vh] lg:overflow-y-auto">
          <div className="space-y-1">
            {surahs.map((s) => (
              <button
                key={s.number}
                onClick={() => setActive(s.number)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active === s.number ? "bg-accent text-primary font-semibold" : "hover:bg-accent/50 text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{s.number}. {s.englishName}</span>
                  <span className="font-arabic text-base text-gold">{s.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">{s.englishNameTranslation} · {s.numberOfAyahs} ayat</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          {currentSurah && (
            <div className="mb-6 border-b border-border pb-5 text-center">
              <div className="font-arabic text-4xl text-gold">{currentSurah.name}</div>
              <h2 className="mt-2 font-serif text-2xl text-foreground">{currentSurah.englishName}</h2>
              <p className="text-sm text-muted-foreground">{currentSurah.englishNameTranslation} · {currentSurah.revelationType} · {currentSurah.numberOfAyahs} verses</p>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6">
              {arabic.map((a, i) => {
                const refKey = `${active}:${a.numberInSurah}`;
                const bookmarked = bookmarks.has(refKey);
                return (
                  <div key={a.number} className="border-b border-border/40 pb-5 last:border-0">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-emerald text-xs font-semibold text-gold">{a.numberInSurah}</span>
                      <button
                        onClick={() => toggleBookmark(active, a.numberInSurah, `${currentSurah?.englishName} ${a.numberInSurah}`)}
                        className={`rounded-md p-1.5 transition-colors ${bookmarked ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
                        aria-label="Bookmark"
                      >
                        <Bookmark className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <p dir="rtl" className="font-arabic text-2xl md:text-3xl leading-loose text-foreground">{a.text}</p>
                    <p className="mt-3 text-base text-muted-foreground">{english[i]?.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
