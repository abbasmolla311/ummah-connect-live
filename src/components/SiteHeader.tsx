import { Link } from "@tanstack/react-router";
import { Menu, X, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/", label: "Home" },
  { to: "/live", label: "Live Azan" },
  { to: "/mosques", label: "Mosques" },
  { to: "/prayer-times", label: "Prayer Times" },
  { to: "/quran", label: "Quran" },
  { to: "/hadith", label: "Hadith" },
  { to: "/duas", label: "Duas" },
  { to: "/qibla", label: "Qibla" },
  { to: "/tasbih", label: "Tasbih" },
  { to: "/calendar", label: "Calendar" },
  { to: "/zakat", label: "Zakat" },
  { to: "/events", label: "Events" },
  { to: "/announcements", label: "Announcements" },
  { to: "/bookmarks", label: "Bookmarks" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

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

        <nav className="hidden items-center gap-0.5 xl:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "rounded-md px-2.5 py-2 text-sm font-medium text-primary bg-accent" }}
            >
              {l.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                to="/mosque-admin"
                className="rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                activeProps={{ className: "rounded-md px-2.5 py-2 text-sm font-medium text-primary bg-accent" }}
              >
                <Settings className="inline h-4 w-4 mr-1" />Admin
              </Link>
              <button
                onClick={signOut}
                className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="ml-2 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold transition-transform hover:scale-[1.02]"
            >
              Sign in
            </Link>
          )}
        </nav>

        <button
          className="xl:hidden rounded-md p-2 text-foreground hover:bg-accent"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background xl:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-1 px-4 py-3 sm:grid-cols-3">
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
            {user ? (
              <>
                <Link
                  to="/mosque-admin"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Admin
                </Link>
                <button
                  onClick={() => { setOpen(false); signOut(); }}
                  className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-accent"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="col-span-full rounded-md bg-gradient-gold px-3 py-2.5 text-center text-sm font-semibold text-gold-foreground"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
