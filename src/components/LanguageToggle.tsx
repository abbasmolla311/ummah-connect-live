import { Languages } from "lucide-react";
import { useLanguage, type Lang } from "@/lib/i18n";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const opts: { value: Lang; label: string }[] = [
    { value: "en", label: "EN" },
    { value: "bn", label: "বাং" },
  ];
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border border-border bg-background p-0.5 ${className}`}>
      <Languages className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      {opts.map((o) => (
        <button
          key={o.value}
          onClick={() => setLang(o.value)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
            lang === o.value ? "bg-gradient-emerald text-gold" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={lang === o.value}
          aria-label={`Switch to ${o.label}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
