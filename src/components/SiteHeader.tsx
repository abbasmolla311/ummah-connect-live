import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { to: "/", label: "Home" },
  { to: "/live", label: "Live Azan" },
  { to: "/mosques", label: "Mosques" },
  { to: "/prayer-times", label: "Prayer Times" },
  { to: "/quran", label: "Quran" },
  { to: "/profile", label: "Profile" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-emerald shadow-emerald">
            <span className="font-arabic text-lg text-gold">ﷲ</span>
          </div>
          <div className="leading-tight">
            <div className="font-serif text-lg font-semibold text-foreground">DeenConnect</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Live Azan · Ummah</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-primary bg-accent" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/live"
            className="ml-2 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold transition-transform hover:scale-[1.02]"
          >
            <span className="h-2 w-2 rounded-full bg-destructive pulse-live" />
            Listen Live
          </Link>
        </nav>

        <button
          className="lg:hidden rounded-md p-2 text-foreground hover:bg-accent"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
