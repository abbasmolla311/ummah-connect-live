import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "bn";

type Dict = Record<string, { en: string; bn: string }>;

// UI strings. Keep keys short and namespaced.
const DICT: Dict = {
  "nav.home": { en: "Home", bn: "হোম" },
  "nav.live": { en: "Live Azan", bn: "লাইভ আজান" },
  "nav.mosques": { en: "Mosques", bn: "মসজিদ" },
  "nav.prayer": { en: "Prayer Times", bn: "নামাজের সময়" },
  "nav.quran": { en: "Quran", bn: "কোরআন" },
  "nav.hadith": { en: "Hadith", bn: "হাদিস" },
  "nav.duas": { en: "Duas", bn: "দোয়া" },
  "nav.qibla": { en: "Qibla", bn: "কিবলা" },
  "nav.tasbih": { en: "Tasbih", bn: "তসবিহ" },
  "nav.calendar": { en: "Calendar", bn: "ক্যালেন্ডার" },
  "nav.zakat": { en: "Zakat", bn: "যাকাত" },
  "nav.events": { en: "Events", bn: "ইভেন্ট" },
  "nav.announcements": { en: "Announcements", bn: "ঘোষণা" },
  "nav.bookmarks": { en: "Bookmarks", bn: "বুকমার্ক" },
  "nav.admin": { en: "Admin", bn: "অ্যাডমিন" },
  "nav.signIn": { en: "Sign in", bn: "সাইন ইন" },
  "nav.signOut": { en: "Sign out", bn: "সাইন আউট" },

  "common.all": { en: "All", bn: "সব" },
  "common.search": { en: "Search…", bn: "অনুসন্ধান…" },
  "common.bookmark": { en: "Bookmark", bn: "বুকমার্ক" },
  "common.signInToBookmark": { en: "Sign in to bookmark", bn: "বুকমার্ক করতে সাইন ইন করুন" },

  "quran.title": { en: "The Holy Quran", bn: "পবিত্র কোরআন" },
  "quran.subtitle": { en: "Arabic with translation", bn: "আরবি ও অনুবাদ" },
  "quran.loadFail": { en: "Could not load surah", bn: "সূরা লোড করা যায়নি" },
  "quran.bookmarked": { en: "Ayah bookmarked", bn: "আয়াত বুকমার্ক হয়েছে" },
  "quran.verses": { en: "verses", bn: "আয়াত" },

  "duas.title": { en: "Daily Duas", bn: "দৈনিক দোয়া" },
  "duas.subtitle": { en: "Supplications from the Quran and Sunnah", bn: "কোরআন ও সুন্নাহ থেকে দোয়াসমূহ" },
  "duas.bookmarked": { en: "Dua bookmarked", bn: "দোয়া বুকমার্ক হয়েছে" },

  "hadith.title": { en: "Hadith Collections", bn: "হাদিস সংগ্রহ" },
  "hadith.subtitle": { en: "Authentic sayings of Prophet Muhammad ﷺ", bn: "মহানবী মুহাম্মদ ﷺ এর প্রামাণিক বাণী" },
  "hadith.searchPlaceholder": { en: "Search hadith or narrator…", bn: "হাদিস বা বর্ণনাকারী খুঁজুন…" },
  "hadith.allCollections": { en: "All collections", bn: "সব সংগ্রহ" },
  "hadith.bookmarked": { en: "Hadith bookmarked", bn: "হাদিস বুকমার্ক হয়েছে" },
  "hadith.narratedBy": { en: "Narrated by", bn: "বর্ণনা করেছেন" },
  "hadith.none": { en: "No hadith match your search.", bn: "আপনার অনুসন্ধানের সাথে কোন হাদিস মেলেনি।" },

  "lang.label": { en: "Language", bn: "ভাষা" },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: keyof typeof DICT | string) => string };
const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("deenconnect.lang") as Lang | null;
      if (stored === "en" || stored === "bn") setLangState(stored);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("deenconnect.lang", l); } catch {}
    if (typeof document !== "undefined") document.documentElement.lang = l;
  };

  const t = (key: string) => {
    const entry = DICT[key];
    if (!entry) return key;
    return entry[lang] ?? entry.en;
  };

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { lang: "en", setLang: () => {}, t: (k) => (DICT[k]?.en ?? k) };
  return ctx;
}
