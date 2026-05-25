import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Moon } from "lucide-react";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Islamic Calendar — DeenConnect" },
      { name: "description", content: "Today's Hijri date, Ramadan & Eid countdown, and upcoming Islamic events." },
    ],
  }),
  component: CalendarPage,
});

type HijriDate = {
  date: string;
  day: string;
  month: { number: number; en: string; ar: string };
  year: string;
  weekday: { en: string; ar: string };
};

const ISLAMIC_EVENTS = [
  { name: "Ramadan begins", hijriMonth: 9, hijriDay: 1 },
  { name: "Laylatul Qadr (likely)", hijriMonth: 9, hijriDay: 27 },
  { name: "Eid al-Fitr", hijriMonth: 10, hijriDay: 1 },
  { name: "Day of Arafah", hijriMonth: 12, hijriDay: 9 },
  { name: "Eid al-Adha", hijriMonth: 12, hijriDay: 10 },
  { name: "Islamic New Year", hijriMonth: 1, hijriDay: 1 },
  { name: "Day of Ashura", hijriMonth: 1, hijriDay: 10 },
  { name: "Mawlid an-Nabi", hijriMonth: 3, hijriDay: 12 },
];

function CalendarPage() {
  const [hijri, setHijri] = useState<HijriDate | null>(null);
  const [upcoming, setUpcoming] = useState<Array<{ name: string; gregorian: string; daysAway: number }>>([]);

  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${today.getFullYear()}`)
      .then((r) => r.json())
      .then((d) => setHijri(d.data?.hijri))
      .catch(() => {});

    // Compute upcoming events by converting Hijri target → Gregorian via aladhan
    Promise.all(ISLAMIC_EVENTS.map(async (ev) => {
      // try current then next Hijri year
      const tryYear = async (year: number) => {
        const res = await fetch(`https://api.aladhan.com/v1/hToG/${String(ev.hijriDay).padStart(2,"0")}-${String(ev.hijriMonth).padStart(2,"0")}-${year}`);
        const j = await res.json();
        const greg = j.data?.gregorian;
        if (!greg) return null;
        const date = new Date(`${greg.year}-${String(greg.month.number).padStart(2,"0")}-${String(greg.day).padStart(2,"0")}`);
        return date;
      };
      try {
        const res = await fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${today.getFullYear()}`);
        const j = await res.json();
        const currentHy = Number(j.data?.hijri?.year ?? 1446);
        let d = await tryYear(currentHy);
        if (!d || d.getTime() < today.getTime()) d = await tryYear(currentHy + 1);
        if (!d) return null;
        const days = Math.ceil((d.getTime() - today.getTime()) / 86400000);
        return { name: ev.name, gregorian: d.toDateString(), daysAway: days };
      } catch { return null; }
    })).then((rows) => {
      const valid = rows.filter((r): r is { name: string; gregorian: string; daysAway: number } => r !== null);
      valid.sort((a, b) => a.daysAway - b.daysAway);
      setUpcoming(valid);
    });
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-16">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-emerald shadow-emerald">
          <CalendarDays className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">Islamic Calendar</h1>
          <p className="text-sm text-muted-foreground">Hijri date and upcoming Islamic events</p>
        </div>
      </div>

      <section className="rounded-3xl border border-gold/20 bg-gradient-emerald p-8 text-center text-primary-foreground shadow-emerald">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Today (Hijri)</p>
        {hijri ? (
          <>
            <div className="mt-3 font-serif text-5xl">
              {hijri.day} <span className="text-gold">{hijri.month.en}</span> {hijri.year}
            </div>
            <div className="mt-2 font-arabic text-2xl text-gold">{hijri.day} {hijri.month.ar} {hijri.year}</div>
            <div className="mt-1 text-sm text-primary-foreground/70">{hijri.weekday.en} · {hijri.weekday.ar}</div>
          </>
        ) : (
          <div className="mt-3 text-primary-foreground/70">Loading…</div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-foreground">Upcoming Islamic events</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {upcoming.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground sm:col-span-2">Loading events…</div>
          )}
          {upcoming.map((ev) => (
            <div key={ev.name} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent">
                <Moon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">{ev.name}</div>
                <div className="text-xs text-muted-foreground">{ev.gregorian}</div>
              </div>
              <div className="text-right">
                <div className="font-serif text-xl text-primary">{ev.daysAway}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">days</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
