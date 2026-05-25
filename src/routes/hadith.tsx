import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Scroll, Bookmark, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { HADITHS, type Hadith } from "@/lib/hadith-data";
import { toast } from "sonner";

export const Route = createFileRoute("/hadith")({
  head: () => ({
    meta: [
      { title: "Hadith — DeenConnect" },
      { name: "description", content: "Read authentic hadith from the major collections including Bukhari, Muslim, and the 40 Hadith of Imam an-Nawawi." },
    ],
  }),
  component: HadithPage,
});

function HadithPage() {
  const [collection, setCollection] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setBookmarks(new Set()); return; }
    supabase.from("bookmarks").select("ref_key").eq("kind", "hadith").eq("user_id", user.id)
      .then(({ data }) => setBookmarks(new Set((data ?? []).map((b: { ref_key: string }) => b.ref_key))));
  }, [user]);

  const toggle = async (h: Hadith) => {
    if (!user) { toast.error("Sign in to bookmark"); return; }
    if (bookmarks.has(h.id)) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("kind", "hadith").eq("ref_key", h.id);
      setBookmarks((s) => { const n = new Set(s); n.delete(h.id); return n; });
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, kind: "hadith", ref_key: h.id, label: `${h.collection} ${h.number}` });
      setBookmarks((s) => new Set(s).add(h.id));
      toast.success("Hadith bookmarked");
    }
  };

  const collections = ["all", ...Array.from(new Set(HADITHS.map((h) => h.collection)))];
  const filtered = HADITHS.filter((h) => (collection === "all" || h.collection === collection) &&
    (query === "" || h.english.toLowerCase().includes(query.toLowerCase()) || h.narrator.toLowerCase().includes(query.toLowerCase())));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-emerald shadow-emerald">
          <Scroll className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">Hadith Collections</h1>
          <p className="text-sm text-muted-foreground">Authentic sayings of Prophet Muhammad ﷺ</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hadith or narrator…"
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-secondary"
          />
        </div>
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-secondary"
        >
          {collections.map((c) => <option key={c} value={c}>{c === "all" ? "All collections" : c}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((h) => {
          const marked = bookmarks.has(h.id);
          return (
            <article key={h.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">{h.collection} · #{h.number}</span>
                <button
                  onClick={() => toggle(h)}
                  className={`rounded-md p-1.5 ${marked ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
                  aria-label="Bookmark"
                >
                  <Bookmark className="h-4 w-4" fill={marked ? "currentColor" : "none"} />
                </button>
              </div>
              {h.arabic && <p dir="rtl" className="font-arabic text-xl leading-loose text-foreground">{h.arabic}</p>}
              <p className="mt-4 text-foreground">{h.english}</p>
              <p className="mt-3 text-sm text-muted-foreground">— Narrated by {h.narrator}</p>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No hadith match your search.</div>
        )}
      </div>
    </div>
  );
}
