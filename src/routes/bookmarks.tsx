import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, BookOpen, Heart, Library, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "My Bookmarks — DeenConnect" },
      { name: "description", content: "All your saved ayahs, hadiths, and duas in one place." },
    ],
  }),
  component: BookmarksPage,
});

type Row = { id: string; kind: string; ref_key: string; label: string | null; note: string | null; created_at: string };

const KIND_META: Record<string, { label: string; icon: typeof BookOpen; href: string; tint: string }> = {
  quran: { label: "Quran", icon: BookOpen, href: "/quran", tint: "text-secondary" },
  hadith: { label: "Hadith", icon: Library, href: "/hadith", tint: "text-primary" },
  dua: { label: "Dua", icon: Heart, href: "/duas", tint: "text-gold" },
};

function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) { setRows([]); setLoading(false); return; }
    setLoading(true);
    supabase.from("bookmarks").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows(((data ?? []) as Row[]));
        setLoading(false);
      });
  }, [user]);

  const remove = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("bookmarks").delete().eq("id", id).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast("Removed");
  };

  if (authLoading) return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">Loading…</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <Bookmark className="mx-auto h-10 w-10 text-gold" />
        <h1 className="mt-4 font-serif text-3xl text-foreground">Sign in to see bookmarks</h1>
        <p className="mt-2 text-muted-foreground">Save ayahs, hadiths, and duas to read again any time.</p>
        <Link to="/auth" className="mt-6 inline-block rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold">Sign in</Link>
      </div>
    );
  }

  const filtered = filter === "all" ? rows : rows.filter((r) => r.kind === filter);
  const kinds = Array.from(new Set(rows.map((r) => r.kind)));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">
      <header className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-gold shadow-gold">
          <Bookmark className="h-6 w-6 text-gold-foreground" />
        </div>
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">My Bookmarks</h1>
          <p className="text-sm text-muted-foreground">{rows.length} saved item{rows.length === 1 ? "" : "s"}</p>
        </div>
      </header>

      {rows.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(["all", ...kinds] as const).map((k) => {
            const active = filter === k;
            return (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  active ? "bg-gradient-emerald text-gold shadow-emerald" : "border border-border text-foreground hover:bg-accent"
                }`}
              >{k}</button>
            );
          })}
        </div>
      )}

      {loading ? (
        <p className="text-center text-muted-foreground">Loading bookmarks…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No bookmarks yet. Tap the bookmark icon on any ayah, hadith, or dua.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/quran" className="rounded-full bg-accent px-4 py-2 text-sm">Open Quran</Link>
            <Link to="/hadith" className="rounded-full bg-accent px-4 py-2 text-sm">Read Hadith</Link>
            <Link to="/duas" className="rounded-full bg-accent px-4 py-2 text-sm">Browse Duas</Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((b) => {
            const meta = KIND_META[b.kind] ?? { label: b.kind, icon: Bookmark, href: "/", tint: "text-foreground" };
            const Icon = meta.icon;
            return (
              <li key={b.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent ${meta.tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{meta.label}</span>
                    <span className="text-xs text-muted-foreground">· {new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="mt-0.5 font-serif text-lg text-foreground truncate">{b.label ?? b.ref_key}</h3>
                  {b.note && <p className="mt-1 text-sm text-muted-foreground">{b.note}</p>}
                  <Link to={meta.href} className="mt-2 inline-block text-xs font-medium text-secondary hover:underline">
                    Open {meta.label.toLowerCase()} →
                  </Link>
                </div>
                <button onClick={() => remove(b.id)} aria-label="Remove" className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
