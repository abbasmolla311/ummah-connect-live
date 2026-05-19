import { createFileRoute } from "@tanstack/react-router";
import { Sunrise, Sun, Sunset, Moon, Cloud, Bell } from "lucide-react";
import { todayPrayers, hijriDate, gregorianDate, getNextPrayer } from "@/lib/mock-data";

export const Route = createFileRoute("/prayer-times")({
  head: () => ({
    meta: [
      { title: "Prayer Times — DeenConnect" },
      { name: "description", content: "Accurate daily prayer times with azan notifications for your location." },
    ],
  }),
  component: PrayerTimesPage,
});

const icons = {
  fajr: Moon, sunrise: Sunrise, zuhr: Sun, asr: Cloud, maghrib: Sunset, isha: Moon,
} as const;

const arabic = {
  fajr: "الفجر", sunrise: "الشروق", zuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء",
} as const;

function PrayerTimesPage() {
  const next = getNextPrayer();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
      <div className="overflow-hidden rounded-3xl bg-gradient-hero p-10 text-primary-foreground shadow-emerald islamic-pattern md:p-14">
        <div className="text-xs uppercase tracking-[0.25em] text-gold">{gregorianDate}</div>
        <h1 className="mt-2 font-serif text-5xl md:text-6xl">Today's Prayers</h1>
        <p className="font-arabic mt-3 text-2xl text-gold">{hijriDate}</p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <div className="rounded-2xl border border-gold/30 bg-primary/40 px-6 py-4 backdrop-blur">
            <div className="text-xs uppercase tracking-wider text-gold">Next prayer</div>
            <div className="mt-1 font-serif text-3xl">{next.name} · <span className="text-gold">{next.time}</span></div>
            <div className="text-sm text-primary-foreground/70">in {next.in}</div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-3 text-sm font-semibold text-gold hover:bg-gold hover:text-gold-foreground transition-colors">
            <Bell className="h-4 w-4" /> Enable azan notifications
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.entries(todayPrayers) as [keyof typeof icons, string][]).map(([name, time]) => {
          const Icon = icons[name];
          const isNext = name === "maghrib";
          return (
            <div
              key={name}
              className={`rounded-2xl border p-6 transition-all ${
                isNext ? "border-gold bg-gradient-emerald text-primary-foreground shadow-emerald" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${isNext ? "bg-gold/20 text-gold" : "bg-accent text-primary"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`font-arabic text-2xl ${isNext ? "text-gold" : "text-secondary"}`}>{arabic[name]}</span>
              </div>
              <div className={`mt-5 text-xs uppercase tracking-wider ${isNext ? "text-gold" : "text-muted-foreground"}`}>{name}</div>
              <div className="mt-1 font-serif text-4xl">{time}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl">Calculation method</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Times are calculated using the <strong className="text-foreground">Islamic Society of North America (ISNA)</strong> method.
          When Lovable Cloud is enabled, your mosque admins can override these with their own jamaat times.
        </p>
      </div>
    </div>
  );
}
