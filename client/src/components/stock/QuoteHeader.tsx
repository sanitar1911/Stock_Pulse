import { ArrowUp, ArrowDown } from "lucide-react";
import type { QuoteData } from "@/lib/finnhub";
import { useT } from "@/lib/i18n";

function fmt(val: number | null | undefined, opts?: { style?: string; decimals?: number; compact?: boolean }): string {
  if (val === null || val === undefined) return "N/A";
  if (opts?.compact) {
    if (Math.abs(val) >= 1e12) return (val / 1e12).toFixed(2) + "T";
    if (Math.abs(val) >= 1e9) return (val / 1e9).toFixed(2) + "B";
    if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(2) + "M";
    if (Math.abs(val) >= 1e3) return (val / 1e3).toFixed(2) + "K";
  }
  if (opts?.style === "percent") return (val * 100).toFixed(2) + "%";
  return val.toFixed(opts?.decimals ?? 2);
}

export default function QuoteHeader({ quote }: { quote: QuoteData }) {
  const t = useT();
  const isPositive = (quote.regularMarketChange ?? 0) >= 0;
  const color = isPositive ? "text-emerald-500" : "text-red-500";

  const stats = [
    { label: t("header.open"), value: fmt(quote.regularMarketOpen) },
    { label: t("header.prevClose"), value: fmt(quote.regularMarketPreviousClose) },
    { label: t("header.high"), value: fmt(quote.regularMarketDayHigh) },
    { label: t("header.low"), value: fmt(quote.regularMarketDayLow) },
    { label: t("header.volume"), value: fmt(quote.regularMarketVolume, { compact: true, decimals: 0 }) },
    { label: t("header.marketCap"), value: fmt(quote.marketCap, { compact: true }) },
    { label: t("header.52wHigh"), value: fmt(quote.fiftyTwoWeekHigh) },
    { label: t("header.52wLow"), value: fmt(quote.fiftyTwoWeekLow) },
  ];

  return (
    <div className="space-y-4" data-testid="quote-header">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h2 className="text-xl font-bold">{quote.symbol}</h2>
        <span className="text-sm text-muted-foreground">{quote.name}</span>
        <span className="text-xs text-muted-foreground">{quote.exchange}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          quote.marketState === "REGULAR"
            ? "bg-emerald-500/10 text-emerald-500"
            : "bg-muted text-muted-foreground"
        }`}>
          {quote.marketState === "REGULAR" ? t("header.marketOpen") : t("header.marketClosed")}
        </span>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold tabular-nums">
          ${fmt(quote.regularMarketPrice)}
        </span>
        <div className={`flex items-center gap-1 ${color}`}>
          {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          <span className="font-medium tabular-nums">
            {isPositive ? "+" : ""}{fmt(quote.regularMarketChange)}
          </span>
          <span className="tabular-nums">
            ({isPositive ? "+" : ""}{fmt(quote.regularMarketChangePercent !== null ? quote.regularMarketChangePercent * 100 : null, { decimals: 2 })}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="space-y-0.5">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-sm font-medium tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
