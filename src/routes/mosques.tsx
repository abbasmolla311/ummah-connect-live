import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, Users, Radio } from "lucide-react";
import { useState } from "react";
import { useMosques } from "@/lib/use-mosques";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/mosques")({
  head: () => ({
    meta: [
      { title: "Find Mosques — DeenConnect" },
      { name: "description", content: "Discover and follow mosques near you. Get live azan and prayer time updates." },
    ],
  }),
  component: MosquesPage,
});

function MosquesPage() {
  const [q, setQ] = useState("");
  const { mosques, loading } = useMosques();
  const { user } = useAuth();

  const filtered = mosques.filter(
    (m) => m.name.toLowerCase().includes(q.toLowerCase()) || (m.village ?? "").toLowerCase().includes(q.toLowerCase())
  );
  const liveCount = mosques.filter((m) => m.is_live).length;

  const follow = async (mosqueId: string) => {
    if (!user) return toast.error("Sign in to follow mosques");
    const { error } = await supabase.from("mosque_followers").insert({ user_id: user.id, mosque_id: mosqueId });
    if (error) {
      if (error.code === "23505") toast.info("You already follow this mosque");
      else toast.error(error.message);
    } else {
      toast.success("Following");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-secondary">Directory</div>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">Find a mosque near you</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {mosques.length} mosques connected · {liveCount} broadcasting live
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or village…"
            className="h-12 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-secondary"
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-12 text-center text-muted-foreground">Loading mosques…</div>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <article key={m.id} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-emerald">
              <Link to="/mosques/$id" params={{ id: m.id }} className="block">
                <div className="flex items-start justify-between">
                  <div>
                    {m.arabic_name && <div className="font-arabic text-gold">{m.arabic_name}</div>}
                    <h2 className="mt-1 font-serif text-2xl text-foreground group-hover:text-secondary">{m.name}</h2>
                  </div>
                  {m.is_live && (
                    <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive pulse-live" /> LIVE
                    </span>
                  )}
                </div>
                {m.imam_name && <p className="mt-2 text-sm text-muted-foreground">Imam: {m.imam_name}</p>}
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {m.village ? `${m.village}, ` : ""}{m.city}, {m.country}
                </p>
              </Link>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {m.followers_count.toLocaleString()} followers
                </span>
                {m.is_live ? (
                  <Link to="/live" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-emerald px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                    <Radio className="h-3 w-3" /> Listen
                  </Link>
                ) : (
                  <button
                    onClick={() => follow(m.id)}
                    className="rounded-full border border-secondary px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-secondary hover:text-secondary-foreground transition-colors"
                  >
                    Follow
                  </button>
                )}
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
              No mosques match "{q}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
