import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Radio, Plus, MapPin, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mosque-admin")({
  head: () => ({
    meta: [
      { title: "Mosque Admin — DeenConnect" },
      { name: "description", content: "Register your mosque, manage imam details, and broadcast live azan to your jamaat." },
    ],
  }),
  component: MosqueAdminPage,
});

type Mosque = {
  id: string;
  name: string;
  arabic_name: string | null;
  imam_name: string | null;
  imam_bio: string | null;
  village: string | null;
  city: string;
  country: string;
  is_live: boolean;
  followers_count: number;
  listeners_count: number;
};

function MosqueAdminPage() {
  const { user } = useAuth();
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("mosques")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setMosques((data ?? []) as Mosque[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggleLive = async (m: Mosque) => {
    const next = !m.is_live;
    const { error } = await supabase
      .from("mosques")
      .update({
        is_live: next,
        live_started_at: next ? new Date().toISOString() : null,
        listeners_count: next ? m.listeners_count : 0,
      })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Azan broadcast started" : "Broadcast stopped");
    load();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-secondary">Mosque Admin</div>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">Manage your mosques</h1>
          <p className="mt-2 text-muted-foreground">Register a mosque, manage imam profile, and broadcast live azan.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-emerald px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-emerald"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Register a mosque"}
        </button>
      </div>

      {showForm && <RegisterForm onDone={() => { setShowForm(false); load(); }} />}

      <div className="mt-10 space-y-4">
        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : mosques.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Radio className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-serif text-xl">No mosques yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Register your first mosque to start broadcasting.</p>
          </div>
        ) : (
          mosques.map((m) => (
            <article key={m.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-arabic text-gold">{m.arabic_name}</div>
                  <h2 className="mt-1 font-serif text-2xl">{m.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {m.village ? `${m.village}, ` : ""}{m.city}, {m.country}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <UserIcon className="h-3.5 w-3.5" /> Imam: {m.imam_name || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Followers</div>
                  <div className="font-serif text-2xl text-primary">{m.followers_count}</div>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <button
                  onClick={() => toggleLive(m)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    m.is_live
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-gradient-gold text-gold-foreground shadow-gold"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full bg-current ${m.is_live ? "pulse-live" : ""}`} />
                  {m.is_live ? "Stop broadcast" : "Start Azan broadcast"}
                </button>
                {m.is_live && (
                  <span className="text-sm text-muted-foreground">
                    {m.listeners_count} listening now
                  </span>
                )}
              </div>
              <MosquePostPanel mosqueId={m.id} />
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    arabic_name: "",
    imam_name: "",
    imam_bio: "",
    village: "",
    city: "",
    country: "India",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("mosques").insert({
      ...form,
      owner_id: user.id,
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    // Grant mosque_admin role (best effort — needs admin to insert into user_roles; we skip and rely on owner-based RLS)
    toast.success("Mosque registered");
    setBusy(false);
    onDone();
  };

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-secondary/30 bg-card p-6 shadow-emerald">
      <h2 className="font-serif text-2xl">Register a mosque</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Mosque name *">
          <input required value={form.name} onChange={upd("name")} className="input" />
        </Field>
        <Field label="Arabic name">
          <input value={form.arabic_name} onChange={upd("arabic_name")} className="input font-arabic" dir="rtl" />
        </Field>
        <Field label="Imam name">
          <input value={form.imam_name} onChange={upd("imam_name")} className="input" />
        </Field>
        <Field label="Village / area">
          <input value={form.village} onChange={upd("village")} className="input" />
        </Field>
        <Field label="City *">
          <input required value={form.city} onChange={upd("city")} className="input" />
        </Field>
        <Field label="Country">
          <input value={form.country} onChange={upd("country")} className="input" />
        </Field>
        <Field label="Imam bio" className="md:col-span-2">
          <textarea value={form.imam_bio} onChange={upd("imam_bio")} rows={3} className="input" />
        </Field>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="mt-5 rounded-full bg-gradient-emerald px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-emerald disabled:opacity-50"
      >
        {busy ? "Saving…" : "Register mosque"}
      </button>
      <style>{`.input{height:2.75rem;width:100%;border-radius:0.5rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:0 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:hsl(var(--secondary))}textarea.input{height:auto;padding:0.5rem 0.75rem}`}</style>
    </form>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function MosquePostPanel({ mosqueId }: { mosqueId: string }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"announcement" | "event">("announcement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    if (mode === "announcement") {
      const { error } = await supabase.from("announcements").insert({
        mosque_id: mosqueId, author_id: user.id, title, body, category,
      });
      if (error) { toast.error(error.message); setBusy(false); return; }
      toast.success("Announcement posted");
    } else {
      if (!startsAt) { toast.error("Pick a start date/time"); setBusy(false); return; }
      const { error } = await supabase.from("events").insert({
        mosque_id: mosqueId, organizer_id: user.id, title, description: body, category,
        starts_at: new Date(startsAt).toISOString(), location: location || null,
      });
      if (error) { toast.error(error.message); setBusy(false); return; }
      toast.success("Event created");
    }
    setTitle(""); setBody(""); setStartsAt(""); setLocation("");
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="mt-5 rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-center gap-2">
        {(["announcement", "event"] as const).map((m) => (
          <button type="button" key={m} onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${mode === m ? "bg-gradient-emerald text-gold shadow-emerald" : "border border-border text-muted-foreground hover:bg-accent"}`}>
            {m}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-secondary md:col-span-2" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
          {mode === "announcement"
            ? ["general","jumma","janaza","class","fundraising"].map((c) => <option key={c}>{c}</option>)
            : ["general","jumma","taraweeh","quran-class","seminar","nikah"].map((c) => <option key={c}>{c}</option>)}
        </select>
        {mode === "event" && (
          <>
            <input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
            <input placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm md:col-span-2" />
          </>
        )}
        <textarea placeholder={mode === "announcement" ? "Announcement body" : "Event description"} value={body} onChange={(e) => setBody(e.target.value)} rows={2}
          className="rounded-lg border border-border bg-background p-2 text-sm outline-none focus:border-secondary md:col-span-2" required={mode === "announcement"} />
      </div>
      <button disabled={busy} className="mt-3 rounded-full bg-gradient-gold px-4 py-1.5 text-xs font-semibold text-gold-foreground shadow-gold disabled:opacity-50">
        {busy ? "Posting…" : `Post ${mode}`}
      </button>
    </form>
  );
}
