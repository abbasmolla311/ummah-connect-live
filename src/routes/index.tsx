import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, MapPin, Clock, BookOpen, Compass, Heart, Bell, Users } from "lucide-react";
import heroImg from "@/assets/mosque-hero.jpg";
import { mosques, todayPrayers, hijriDate, gregorianDate, getNextPrayer, dailyAyah, dailyHadith } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DeenConnect — Live Azan & Islamic Community Platform" },
      { name: "description", content: "Hear live azan from your mosque, view prayer times, read Quran & Hadith. A global Islamic community network." },
      { property: "og:title", content: "DeenConnect — Live Azan & Islamic Community" },
      { property: "og:description", content: "Live azan broadcasting, prayer times, Quran, Qibla and community for the Ummah." },
    ],
  }),
  component: HomePage,
});

const liveMosques = mosques.filter((m) => m.isLive);
const next = getNextPrayer();

function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="Mosque silhouette with golden crescent moon"
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="absolute inset-0 islamic-pattern opacity-40" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:py-36">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-primary/40 px-3 py-1.5 text-xs font-medium tracking-wide text-gold backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive pulse-live" />
              {liveMosques.length} mosques broadcasting live now
            </div>
            <h1 className="font-serif text-5xl font-semibold leading-[1.05] text-primary-foreground md:text-7xl">
              When the azan calls,<br />
              <span className="text-gold">the Ummah listens together.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-primary-foreground/80 md:text-lg">
              A live Islamic network connecting mosques and people. Hear the azan from your masjid in real time, anywhere in the world.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/live"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition-transform hover:scale-[1.02]"
              >
                <Radio className="h-4 w-4" /> Listen Live
              </Link>
              <Link
                to="/mosques"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/5 px-6 py-3.5 text-sm font-semibold text-primary-foreground backdrop-blur hover:bg-primary-foreground/10"
              >
                <MapPin className="h-4 w-4" /> Find Mosques
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-6 text-primary-foreground/70">
              <Stat k="2,400+" v="Connected mosques" />
              <Stat k="180k" v="Listeners daily" />
              <Stat k="42" v="Countries" />
            </div>
          </div>
        </div>
      </section>

      {/* Today's prayer strip */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{gregorianDate}</div>
              <div className="font-arabic mt-0.5 text-lg text-primary">{hijriDate}</div>
            </div>
            <div className="flex items-center gap-3 rounded-full bg-gradient-emerald px-5 py-2.5 text-primary-foreground shadow-emerald">
              <Bell className="h-4 w-4 text-gold" />
              <span className="text-sm">Next prayer</span>
              <span className="font-semibold">{next.name}</span>
              <span className="text-gold">{next.time}</span>
              <span className="text-xs text-primary-foreground/70">in {next.in}</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 md:grid-cols-6">
            {Object.entries(todayPrayers).map(([name, time]) => (
              <div key={name} className="rounded-lg border border-border bg-background p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{name}</div>
                <div className="mt-1 font-serif text-xl text-foreground">{time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live now */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionTitle eyebrow="Now broadcasting" title="Live azan happening right now" />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {liveMosques.map((m) => (
            <Link
              key={m.id}
              to="/live"
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-emerald"
            >
              <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive pulse-live" /> LIVE
              </div>
              <div className="flex items-end gap-1 h-8 mb-4">
                {[0.3, 0.7, 1, 0.5, 0.8, 0.4, 0.9, 0.6].map((h, i) => (
                  <span key={i} className="w-1 rounded-full bg-gradient-emerald sound-bar" style={{ height: `${h * 100}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <div className="font-arabic text-gold">{m.arabicName}</div>
              <h3 className="mt-1 font-serif text-2xl text-foreground">{m.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.village} · {m.distanceKm} km away</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{m.imam}</span>
                <span className="flex items-center gap-1 font-medium text-primary"><Users className="h-3.5 w-3.5" /> {m.listeners}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick tools */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <SectionTitle eyebrow="Your daily companion" title="Everything for your deen, in one place" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ToolCard icon={Radio} title="Live Azan" desc="Hear azan from any connected mosque, in real time." to="/live" />
          <ToolCard icon={Clock} title="Prayer Times" desc="Accurate times calculated for your exact location." to="/prayer-times" />
          <ToolCard icon={BookOpen} title="Quran & Hadith" desc="Read, listen and bookmark. 7 reciters included." to="/quran" />
          <ToolCard icon={Compass} title="Qibla & Tasbih" desc="GPS qibla, digital tasbih, dua collections." to="/profile" />
        </div>
      </section>

      {/* Daily verse + hadith */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-gradient-emerald p-8 text-primary-foreground shadow-emerald islamic-pattern md:p-10">
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Ayah of the day</div>
            <p className="font-arabic mt-6 text-right text-4xl leading-relaxed text-gold md:text-5xl">{dailyAyah.arabic}</p>
            <p className="mt-6 font-serif text-2xl">"{dailyAyah.translation}"</p>
            <p className="mt-3 text-sm text-primary-foreground/70">— {dailyAyah.reference}</p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-10">
            <div className="text-xs uppercase tracking-[0.2em] text-secondary">Hadith of the day</div>
            <Heart className="mt-6 h-8 w-8 text-gold" />
            <p className="mt-3 font-serif text-2xl text-foreground">"{dailyHadith.text}"</p>
            <p className="mt-4 text-sm text-muted-foreground">Narrated by {dailyHadith.narrator}</p>
            <p className="mt-1 text-sm font-medium text-primary">{dailyHadith.source}</p>
          </div>
        </div>
      </section>

      {/* CTA for mosque admins */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground md:p-16">
          <div className="absolute inset-0 islamic-pattern opacity-30" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-gold">For Imams & Mosque Admins</div>
              <h2 className="mt-3 font-serif text-3xl md:text-5xl">Bring your mosque online. Reach every soul in your community.</h2>
              <p className="mt-4 max-w-xl text-primary-foreground/75">
                Broadcast azan live, share prayer timings, send announcements, and grow your jamaat — all from one simple dashboard.
              </p>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold px-6 py-4 text-sm font-semibold text-gold-foreground shadow-gold hover:scale-[1.02] transition-transform self-start"
            >
              Register your mosque →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="font-serif text-2xl text-gold">{k}</div>
      <div className="text-xs uppercase tracking-wider">{v}</div>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-secondary">{eyebrow}</div>
      <h2 className="mt-2 max-w-2xl font-serif text-3xl text-foreground md:text-4xl">{title}</h2>
    </div>
  );
}

function ToolCard({ icon: Icon, title, desc, to }: { icon: typeof Radio; title: string; desc: string; to: string }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-secondary hover:shadow-emerald"
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-emerald text-gold shadow-emerald">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-serif text-xl text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
