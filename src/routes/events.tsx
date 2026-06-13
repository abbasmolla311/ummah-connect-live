import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Mosque Events — DeenConnect" },
      { name: "description", content: "Discover upcoming events, Jumma reminders, Quran classes, and community gatherings at mosques near you." },
    ],
  }),
  component: EventsPage,
});

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  capacity: number | null;
  mosque_id: string;
  mosques: { name: string; city: string; country: string } | null;
};

function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myRsvps, setMyRsvps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const load = async () => {
    const { data } = await supabase
      .from("events")
      .select("*, mosques(name,city,country)")
      .gte("starts_at", new Date(Date.now() - 86400000).toISOString())
      .order("starts_at", { ascending: true });
    setEvents((data ?? []) as unknown as EventRow[]);
    const ids = (data ?? []).map((e) => e.id);
    if (ids.length) {
      const { data: rsvps } = await supabase.rpc("get_event_attendee_counts", { event_ids: ids });
      const c: Record<string, number> = {};
      (rsvps ?? []).forEach((r: { event_id: string; count: number }) => { c[r.event_id] = Number(r.count); });
      setCounts(c);
    }
    if (user) {
      const { data: mine } = await supabase.from("event_rsvps").select("event_id").eq("user_id", user.id);
      setMyRsvps(new Set((mine ?? []).map((r) => r.event_id)));
    } else {
      setMyRsvps(new Set());
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const toggleRsvp = async (eventId: string) => {
    if (!user) { toast.error("Sign in to RSVP"); return; }
    if (myRsvps.has(eventId)) {
      await supabase.from("event_rsvps").delete().eq("user_id", user.id).eq("event_id", eventId);
    } else {
      const { error } = await supabase.from("event_rsvps").insert({ user_id: user.id, event_id: eventId, status: "going" });
      if (error) { toast.error(error.message); return; }
      toast.success("You're going!");
    }
    load();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-16">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-emerald shadow-emerald">
          <CalendarClock className="h-6 w-6 text-gold" />
        </div>
        <div className="flex-1">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">Mosque Events</h1>
          <p className="text-sm text-muted-foreground">Jumma, classes, lectures, and community gatherings</p>
        </div>
        {user && (
          <Link to="/mosque-admin" className="hidden sm:inline-flex rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
            Host an event
          </Link>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">Loading…</div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No upcoming events yet.</p>
          {user && <Link to="/mosque-admin" className="mt-3 inline-block text-primary font-semibold hover:underline">Be the first to post one →</Link>}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((e) => {
            const date = new Date(e.starts_at);
            const going = myRsvps.has(e.id);
            return (
              <article key={e.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="grid h-16 w-16 shrink-0 flex-col place-items-center rounded-xl bg-gradient-emerald text-center text-primary-foreground">
                    <div className="text-xs uppercase tracking-widest text-gold">{date.toLocaleString(undefined,{month:"short"})}</div>
                    <div className="font-serif text-2xl">{date.getDate()}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-xl text-foreground">{e.title}</h2>
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-primary">{e.category}</span>
                    </div>
                    {e.description && <p className="mt-2 text-sm text-muted-foreground">{e.description}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {date.toLocaleString()}</span>
                      {e.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {e.location}</span>}
                      {e.mosques && <span>{e.mosques.name} · {e.mosques.city}</span>}
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {counts[e.id] ?? 0} going{e.capacity ? ` / ${e.capacity}` : ""}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRsvp(e.id)}
                    className={`self-start rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                      going ? "bg-gradient-gold text-gold-foreground shadow-gold" : "border border-border text-foreground hover:bg-accent"
                    }`}
                  >
                    {going ? "Going ✓" : "RSVP"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
