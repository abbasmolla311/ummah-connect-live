import { createFileRoute } from "@tanstack/react-router";
import { User, Bell, MapPin, Heart, Settings, LogOut, Compass, Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — DeenConnect" },
      { name: "description", content: "Your followed mosques, prayer settings, and Islamic tools." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [count, setCount] = useState(0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
      <div className="rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-emerald islamic-pattern md:p-12">
        <div className="flex flex-wrap items-center gap-6">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gold text-3xl font-serif text-gold-foreground">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Assalamu Alaikum</div>
            <h1 className="mt-1 font-serif text-3xl md:text-4xl">Ahmad Rahman</h1>
            <p className="mt-1 text-sm text-primary-foreground/70 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Greenfield, Hyderabad
            </p>
          </div>
          <button className="rounded-full border border-gold/40 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold hover:text-gold-foreground transition-colors">
            Edit profile
          </button>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-gold/15 pt-6 text-center">
          <div><div className="font-serif text-3xl text-gold">3</div><div className="text-xs uppercase tracking-wider text-primary-foreground/70">Following</div></div>
          <div><div className="font-serif text-3xl text-gold">47</div><div className="text-xs uppercase tracking-wider text-primary-foreground/70">Azan heard</div></div>
          <div><div className="font-serif text-3xl text-gold">12</div><div className="text-xs uppercase tracking-wider text-primary-foreground/70">Bookmarks</div></div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* Tasbih */}
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-secondary">Digital Tasbih</div>
          <p className="font-arabic mt-4 text-4xl text-primary">سُبْحَانَ ٱللَّٰهِ</p>
          <p className="text-sm text-muted-foreground mt-1">Subhan Allah</p>
          <button
            onClick={() => setCount((c) => c + 1)}
            className="mt-6 grid h-36 w-36 mx-auto place-items-center rounded-full bg-gradient-emerald font-serif text-5xl text-gold shadow-emerald transition-transform active:scale-95"
          >
            {count}
          </button>
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={() => setCount(0)} className="rounded-full border border-border px-4 py-1.5 text-xs font-medium hover:bg-accent">Reset</button>
            <span className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium">Target: 33</span>
          </div>
        </div>

        {/* Qibla */}
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-secondary">Qibla Direction</div>
          <h3 className="mt-2 font-serif text-2xl">Facing the Kaaba</h3>
          <div className="relative mx-auto mt-6 h-44 w-44">
            <div className="absolute inset-0 rounded-full border-4 border-accent" />
            <div className="absolute inset-2 rounded-full border border-secondary/30" />
            <div className="absolute left-1/2 top-1/2 h-32 w-1 -translate-x-1/2 -translate-y-1/2 origin-center rotate-[68deg]">
              <div className="h-1/2 w-full rounded-t-full bg-gradient-gold shadow-gold" />
              <div className="h-1/2 w-full bg-secondary/40" />
            </div>
            <Compass className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary" />
          </div>
          <p className="mt-5 font-serif text-2xl text-primary">68° NE</p>
          <p className="text-xs text-muted-foreground mt-1">8,432 km to Makkah</p>
        </div>
      </div>

      {/* Menu */}
      <div className="mt-10 rounded-2xl border border-border bg-card p-2">
        {[
          { icon: Heart, label: "Followed Mosques", desc: "3 mosques" },
          { icon: Bell, label: "Notifications", desc: "Azan, prayer reminders, events" },
          { icon: Plus, label: "Register your mosque", desc: "Become a mosque admin" },
          { icon: Settings, label: "Settings", desc: "Language, calculation method, theme" },
          { icon: LogOut, label: "Sign out", desc: "" },
        ].map((item) => (
          <button key={item.label} className="flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors hover:bg-accent">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{item.label}</div>
              {item.desc && <div className="text-xs text-muted-foreground">{item.desc}</div>}
            </div>
            <span className="text-muted-foreground">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
