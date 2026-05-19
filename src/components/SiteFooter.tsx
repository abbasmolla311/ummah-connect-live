export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold">
              <span className="font-arabic text-lg text-primary">ﷲ</span>
            </div>
            <span className="font-serif text-xl">DeenConnect</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/70">
            A live Islamic communication network connecting mosques and communities — azan, prayer times, Quran, and the Ummah, in one place.
          </p>
        </div>
        <div className="text-sm">
          <div className="mb-3 font-semibold text-gold">Platform</div>
          <ul className="space-y-2 text-primary-foreground/75">
            <li>Live Azan Broadcasting</li>
            <li>Mosque Directory</li>
            <li>Prayer Times</li>
            <li>Quran & Hadith</li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="mb-3 font-semibold text-gold">Community</div>
          <ul className="space-y-2 text-primary-foreground/75">
            <li>For Mosque Admins</li>
            <li>For Villages</li>
            <li>Donations & Zakat</li>
            <li>Madrasa Programs</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 px-6 py-5 text-center text-xs text-primary-foreground/60">
        © 2026 DeenConnect · Built with love for the Ummah · بِسْمِ اللَّهِ
      </div>
    </footer>
  );
}
