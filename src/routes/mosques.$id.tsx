import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Users, Radio, Calendar, Megaphone, Heart, HeartOff, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { DbMosque } from "@/lib/use-mosques";
import { toast } from "sonner";

export const Route = createFileRoute("/mosques/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Mosque Profile — DeenConnect` },
      { name: "description", content: "Live azan, announcements, and events from this mosque." },
      { property: "og:title", content: `Mosque on DeenConnect` },
    ],
  }),
  component: MosqueProfilePage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-serif text-3xl text-foreground">Couldn't load mosque</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
      <Link to="/mosques" className="mt-6 inline-block text-secondary underline">Back to mosques</Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-serif text-3xl">Mosque not found</h1>
      <Link to="/mosques" className="mt-4 inline-block text-secondary underline">Browse all mosques</Link>
    </div>
  ),
});

type Announcement = { id: string; title: string; body: string; category: string; pinned: boolean; created_at: string };
type Event = { id: string; title: string; description: string | null; category: string; starts_at: string; ends_at: string | null; location: string | null };

function MosqueProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mosque, setMosque] = useState<DbMosque | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<"announcements" | "events">("announcements");

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: m }, { data: a }, { data: e }] = await Promise.all([
        supabase.from("mosques").select("*").eq("id", id).maybeSingle(),
        supabase.from("announcements").select("*").eq("mosque_id", id).order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(20),
        supabase.from("events").select("*").eq("mosque_id", id).gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(20),
      ]);
      if (!alive) return;
      setMosque((m as DbMosque | null) ?? null);
      setAnnouncements((a as Announcement[] | null) ?? []);
      setEvents((e as Event[] | null) ?? []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!user) { setFollowing(false); return; }
    supabase.from("mosque_followers").select("id").eq("mosque_id", id).eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setFollowing(Boolean(data)));
  }, [id, user]);

  const toggleFollow = async () => {
    if (!user) { toast.error("Sign in to follow"); navigate({ to: "/auth" }); return; }
    if (following) {
      const { error } = await supabase.from("mosque_followers").delete().eq("user_id", user.id).eq("mosque_id", id);
      if (error) return toast.error(error.message);
      setFollowing(false);
      toast("Unfollowed");
    } else {
      const { error } = await supabase.from("mosque_followers").insert({ user_id: user.id, mosque_id: id });
      if (error && error.code !== "23505") return toast.error(error.message);
      setFollowing(true);
      toast.success("Following");
    }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-24 text-center text-muted-foreground">Loading mosque…</div>;
  if (!mosque) return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-serif text-3xl">Mosque not found</h1>
      <Link to="/mosques" className="mt-4 inline-block text-secondary underline">Browse all mosques</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">
      <Link to="/mosques" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All mosques
      </Link>

      <header className="mt-6 overflow-hidden rounded-3xl border border-border bg-gradient-emerald p-8 text-primary-foreground md:p-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            {mosque.arabic_name && <div className="font-arabic text-3xl text-gold">{mosque.arabic_name}</div>}
            <h1 className="mt-2 font-serif text-4xl md:text-5xl">{mosque.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-primary-foreground/80">
              <MapPin className="h-4 w-4" /> {mosque.village ? `${mosque.village}, ` : ""}{mosque.city}, {mosque.country}
            </p>
            {mosque.imam_name && <p className="mt-1 text-sm text-primary-foreground/70">Imam: {mosque.imam_name}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 rounded-full bg-primary/30 px-3 py-1"><Users className="h-3.5 w-3.5" /> {mosque.followers_count.toLocaleString()} followers</span>
              {mosque.is_live && <span className="flex items-center gap-1.5 rounded-full bg-destructive/80 px-3 py-1 font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-white pulse-live" /> LIVE NOW</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {mosque.is_live && (
              <Link to="/live" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold">
                <Radio className="h-4 w-4" /> Listen live
              </Link>
            )}
            <button
              onClick={toggleFollow}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                following ? "bg-primary/40 text-primary-foreground hover:bg-primary/60" : "bg-white text-primary hover:bg-white/90"
              }`}
            >
              {following ? <><HeartOff className="h-4 w-4" /> Unfollow</> : <><Heart className="h-4 w-4" /> Follow</>}
            </button>
          </div>
        </div>
        {mosque.imam_bio && <p className="mt-6 max-w-3xl text-sm leading-relaxed text-primary-foreground/85">{mosque.imam_bio}</p>}
      </header>

      <div className="mt-8 flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("announcements")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "announcements" ? "border-secondary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Megaphone className="h-4 w-4" /> Announcements ({announcements.length})
        </button>
        <button
          onClick={() => setTab("events")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "events" ? "border-secondary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-4 w-4" /> Upcoming events ({events.length})
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {tab === "announcements" && (
          announcements.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">No announcements yet.</p>
          ) : announcements.map((a) => (
            <article key={a.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg text-foreground">{a.title}</h3>
                {a.pinned && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">Pinned</span>}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-foreground/80">{a.body}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-accent px-2 py-0.5">{a.category}</span>
                <span>{new Date(a.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
              </div>
            </article>
          ))
        )}
        {tab === "events" && (
          events.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">No upcoming events.</p>
          ) : events.map((e) => (
            <article key={e.id} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-serif text-lg text-foreground">{e.title}</h3>
              {e.description && <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-accent px-2 py-0.5">{e.category}</span>
                <span>{new Date(e.starts_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                {e.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
