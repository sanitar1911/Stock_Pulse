import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuoteData } from "@/lib/finnhub";
import { useT } from "@/lib/i18n";

function fmtVal(v: number | null, opts?: { pct?: boolean; compact?: boolean; decimals?: number }): string {
  if (v === null || v === undefined) return "N/A";
  if (opts?.pct) return (v * 100).toFixed(opts.decimals ?? 2) + "%";
  if (opts?.compact) {
    if (Math.abs(v) >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
    if (Math.abs(v) >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
    if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  }
  return v.toFixed(opts?.decimals ?? 2);
}

interface MetricRow {
  label: string;
  value: string;
}

function MetricSection({ title, rows }: { title: string; rows: MetricRow[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{r.label}</span>
              <span className="text-sm font-medium tabular-nums">{r.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FundamentalsPanel({ quote }: { quote: QuoteData }) {
  const t = useT();

  const valuation: MetricRow[] = [
    { label: t("fund.pe"), value: quote.pe !== null ? fmtVal(quote.pe) : t("fund.na") },
    { label: t("fund.forwardPe"), value: quote.forwardPe !== null ? fmtVal(quote.forwardPe) : t("fund.na") },
    { label: t("fund.eps"), value: quote.eps !== null ? "$" + fmtVal(quote.eps) : t("fund.na") },
    { label: t("fund.beta"), value: quote.beta !== null ? fmtVal(quote.beta) : t("fund.na") },
    { label: t("fund.dividendYield"), value: quote.dividendYield !== null ? fmtVal(quote.dividendYield, { pct: true }) : t("fund.na") },
    { label: t("fund.dividendRate"), value: quote.dividendRate !== null ? "$" + fmtVal(quote.dividendRate) : t("fund.na") },
  ];

  const profitability: MetricRow[] = [
    { label: t("fund.profitMargin"), value: quote.profitMargins !== null ? fmtVal(quote.profitMargins, { pct: true }) : t("fund.na") },
    { label: t("fund.grossMargin"), value: quote.grossMargins !== null ? fmtVal(quote.grossMargins, { pct: true }) : t("fund.na") },
    { label: t("fund.operatingMargin"), value: quote.operatingMargins !== null ? fmtVal(quote.operatingMargins, { pct: true }) : t("fund.na") },
    { label: t("fund.roe"), value: quote.returnOnEquity !== null ? fmtVal(quote.returnOnEquity, { pct: true }) : t("fund.na") },
  ];

  const growth: MetricRow[] = [
    { label: t("fund.revenueGrowth"), value: quote.revenueGrowth !== null ? fmtVal(quote.revenueGrowth, { pct: true }) : t("fund.na") },
    { label: t("fund.earningsGrowth"), value: quote.earningsGrowth !== null ? fmtVal(quote.earningsGrowth, { pct: true }) : t("fund.na") },
    { label: t("fund.revenue"), value: quote.totalRevenue !== null ? fmtVal(quote.totalRevenue, { compact: true }) : t("fund.na") },
  ];

  const health: MetricRow[] = [
    { label: t("fund.debtToEquity"), value: quote.debtToEquity !== null ? fmtVal(quote.debtToEquity) : t("fund.na") },
    { label: t("fund.currentRatio"), value: quote.currentRatio !== null ? fmtVal(quote.currentRatio) : t("fund.na") },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="fundamentals-panel">
      <MetricSection title={t("fund.valuation")} rows={valuation} />
      <MetricSection title={t("fund.profitability")} rows={profitability} />
      <MetricSection title={t("fund.growth")} rows={growth} />
      <MetricSection title={t("fund.health")} rows={health} />
    </div>
  );
}
