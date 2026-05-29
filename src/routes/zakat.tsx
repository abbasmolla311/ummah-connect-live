import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Coins, Info } from "lucide-react";

export const Route = createFileRoute("/zakat")({
  head: () => ({
    meta: [
      { title: "Zakat Calculator — DeenConnect" },
      { name: "description", content: "Calculate your Zakat at 2.5% on cash, savings, gold, silver, and investments. Includes Nisab guidance." },
      { property: "og:title", content: "Zakat Calculator — DeenConnect" },
    ],
  }),
  component: ZakatPage,
});

// Default Nisab values in USD (silver ~ 612.36g, gold ~ 87.48g). User can override.
const DEFAULT_NISAB_USD = 600; // conservative silver-based Nisab; user updates per current spot price.

function ZakatPage() {
  const [cash, setCash] = useState(0);
  const [bank, setBank] = useState(0);
  const [gold, setGold] = useState(0);
  const [silver, setSilver] = useState(0);
  const [investments, setInvestments] = useState(0);
  const [receivables, setReceivables] = useState(0);
  const [businessGoods, setBusinessGoods] = useState(0);
  const [debts, setDebts] = useState(0);
  const [nisab, setNisab] = useState(DEFAULT_NISAB_USD);
  const [currency, setCurrency] = useState("USD");

  const totals = useMemo(() => {
    const assets = cash + bank + gold + silver + investments + receivables + businessGoods;
    const net = Math.max(assets - debts, 0);
    const meetsNisab = net >= nisab;
    const zakat = meetsNisab ? net * 0.025 : 0;
    return { assets, net, meetsNisab, zakat };
  }, [cash, bank, gold, silver, investments, receivables, businessGoods, debts, nisab]);

  const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">
      <header className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-gold shadow-gold">
          <Coins className="h-6 w-6 text-gold-foreground" />
        </div>
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">Zakat Calculator</h1>
          <p className="text-sm text-muted-foreground">Calculate 2.5% on Zakatable wealth held for one lunar year.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-serif text-xl text-foreground">Your Zakatable assets</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Cash on hand" value={cash} onChange={setCash} currency={currency} />
            <Field label="Bank balances" value={bank} onChange={setBank} currency={currency} />
            <Field label="Gold value" value={gold} onChange={setGold} currency={currency} hint="Current market value of gold you own" />
            <Field label="Silver value" value={silver} onChange={setSilver} currency={currency} hint="Current market value of silver" />
            <Field label="Investments / shares" value={investments} onChange={setInvestments} currency={currency} hint="Zakatable portion of stocks, funds, crypto" />
            <Field label="Money owed to you" value={receivables} onChange={setReceivables} currency={currency} hint="Loans you expect to recover" />
            <Field label="Business stock / goods" value={businessGoods} onChange={setBusinessGoods} currency={currency} hint="Inventory at current market value" />
            <Field label="Debts you owe" value={debts} onChange={setDebts} currency={currency} hint="Subtracted from total wealth" />
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="font-serif text-lg text-foreground">Nisab threshold</h3>
            <p className="mt-1 text-xs text-muted-foreground">Set this to today's silver Nisab (≈612.36g of silver) or gold Nisab (≈87.48g of gold) value in your currency.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr]">
              <Field label="Nisab value" value={nisab} onChange={setNisab} currency={currency} />
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Currency</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-secondary"
                >
                  {["USD","EUR","GBP","SAR","AED","PKR","INR","BDT","TRY","MYR","IDR"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gold/30 bg-gradient-emerald p-6 text-primary-foreground shadow-emerald">
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Your Zakat (2.5%)</div>
            <div className="mt-2 font-serif text-4xl md:text-5xl text-gold">{fmt(totals.zakat)}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Total assets" value={fmt(totals.assets)} />
              <Stat label="Debts" value={fmt(debts)} />
              <Stat label="Net wealth" value={fmt(totals.net)} />
              <Stat label="Nisab" value={fmt(nisab)} />
            </div>
            <p className="mt-4 text-xs text-primary-foreground/80">
              {totals.meetsNisab
                ? "Your net wealth meets Nisab. Zakat is due if held for a full lunar year (hawl)."
                : "Your net wealth is below Nisab. No Zakat is due at this time."}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-2 text-foreground">
              <Info className="mt-0.5 h-4 w-4 text-secondary" />
              <div className="text-xs leading-relaxed text-muted-foreground">
                This calculator is for guidance only. Rules vary by school of jurisprudence (Hanafi, Shafi'i, Maliki, Hanbali). For your specific situation, consult a qualified scholar.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, currency, hint }: { label: string; value: number; onChange: (v: number) => void; currency: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 flex h-11 items-center rounded-md border border-border bg-background focus-within:border-secondary">
        <span className="px-3 text-xs text-muted-foreground">{currency}</span>
        <input
          type="number"
          min={0}
          step={0.01}
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className="h-full w-full bg-transparent pr-3 text-sm outline-none"
        />
      </div>
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-primary/30 p-2">
      <div className="text-[10px] uppercase tracking-wider text-primary-foreground/70">{label}</div>
      <div className="text-sm font-semibold text-primary-foreground">{value}</div>
    </div>
  );
}
