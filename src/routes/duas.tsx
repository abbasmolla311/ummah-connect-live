import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DUAS } from "@/lib/dua-data";
import { toast } from "sonner";

export const Route = createFileRoute("/duas")({
  head: () => ({
    meta: [
      { title: "Daily Duas — DeenConnect" },
      { name: "description", content: "A curated collection of authentic daily duas with Arabic text, transliteration, and English translation." },
    ],
  }),
  component: DuasPage,
});

function DuasPage() {
  const [category, setCategory] = useState<string>("All");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setBookmarks(new Set()); return; }
    supabase.from("bookmarks").select("ref_key").eq("kind", "dua").eq("user_id", user.id)
      .then(({ data }) => setBookmarks(new Set(((data ?? []) as { ref_key: string }[]).map((b) => b.ref_key))));
  }, [user]);

  const categories = ["All", ...Array.from(new Set(DUAS.map((d) => d.category)))];
  const filtered = category === "All" ? DUAS : DUAS.filter((d) => d.category === category);

  const toggle = async (id: string, label: string) => {
    if (!user) { toast.error("Sign in to bookmark"); return; }
    if (bookmarks.has(id)) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("kind", "dua").eq("ref_key", id);
      setBookmarks((s) => { const n = new Set(s); n.delete(id); return n; });
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, kind: "dua", ref_key: id, label });
      setBookmarks((s) => new Set(s).add(id));
      toast.success("Dua bookmarked");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-emerald shadow-emerald">
          <Heart className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">Daily Duas</h1>
          <p className="text-sm text-muted-foreground">Supplications from the Quran and Sunnah</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === c ? "bg-gradient-emerald text-gold shadow-emerald" : "border border-border text-foreground hover:bg-accent"
            }`}
          >{c}</button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((d) => {
          const marked = bookmarks.has(d.id);
          return (
            <article key={d.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl text-foreground">{d.title}</h2>
                  <span className="text-xs text-muted-foreground">{d.category}{d.reference ? ` · ${d.reference}` : ""}</span>
                </div>
                <button
                  onClick={() => toggle(d.id, d.title)}
                  className={`rounded-md p-1.5 ${marked ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
                  aria-label="Bookmark"
                >
                  <Bookmark className="h-4 w-4" fill={marked ? "currentColor" : "none"} />
                </button>
              </div>
              <p dir="rtl" className="font-arabic text-2xl leading-loose text-foreground">{d.arabic}</p>
              <p className="mt-3 text-sm italic text-muted-foreground">{d.transliteration}</p>
              <p className="mt-2 text-foreground">{d.english}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
