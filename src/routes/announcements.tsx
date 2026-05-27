import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Megaphone, Pin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Mosque Announcements — DeenConnect" },
      { name: "description", content: "Latest announcements from mosques: Jumma, Janaza, classes, fundraising, and community news." },
    ],
  }),
  component: AnnouncementsPage,
});

type Row = {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  created_at: string;
  mosque_id: string;
  mosques: { name: string; city: string } | null;
};

function AnnouncementsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*, mosques(name,city)")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      setRows((data ?? []) as unknown as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-16">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-emerald shadow-emerald">
          <Megaphone className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground">Latest community news from mosques across the ummah</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No announcements yet.</div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <article key={r.id} className={`rounded-2xl border bg-card p-6 shadow-sm ${r.pinned ? "border-secondary/40" : "border-border"}`}>
              <div className="flex items-start gap-3">
                {r.pinned && <Pin className="mt-1 h-4 w-4 text-secondary" />}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-xl text-foreground">{r.title}</h2>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-primary">{r.category}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {r.mosques && (
                      <Link to="/mosques" className="font-medium text-primary hover:underline">
                        {r.mosques.name} · {r.mosques.city}
                      </Link>
                    )}
                    <span>{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
