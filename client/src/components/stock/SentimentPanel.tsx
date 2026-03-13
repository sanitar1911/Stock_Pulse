import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuoteData } from "@/lib/finnhub";
import { useT } from "@/lib/i18n";

function getRatingLabel(mean: number | null, t: (k: string) => string): { label: string; color: string } {
  if (mean === null) return { label: "N/A", color: "text-muted-foreground" };
  if (mean <= 1.5) return { label: t("sent.strongBuy"), color: "text-emerald-500" };
  if (mean <= 2.5) return { label: t("sent.buy"), color: "text-green-500" };
  if (mean <= 3.5) return { label: t("sent.hold"), color: "text-yellow-500" };
  if (mean <= 4.5) return { label: t("sent.sell"), color: "text-orange-500" };
  return { label: t("sent.strongSell"), color: "text-red-500" };
}

function getActionLabel(action: string, t: (k: string) => string): string {
  const map: Record<string, string> = {
    up: t("sent.upgrade"),
    down: t("sent.downgrade"),
    main: t("sent.maintain"),
    init: t("sent.initiate"),
    reit: t("sent.reiterate"),
  };
  return map[action] || action;
}

export default function SentimentPanel({ quote }: { quote: QuoteData }) {
  const t = useT();
  const rating = getRatingLabel(quote.recommendationMean, t);
  const total = quote.strongBuy + quote.buy + quote.hold + quote.sell + quote.strongSell;

  const distBars = [
    { label: t("sent.strongBuy"), count: quote.strongBuy, color: "bg-emerald-500" },
    { label: t("sent.buy"), count: quote.buy, color: "bg-green-500" },
    { label: t("sent.hold"), count: quote.hold, color: "bg-yellow-500" },
    { label: t("sent.sell"), count: quote.sell, color: "bg-orange-500" },
    { label: t("sent.strongSell"), count: quote.strongSell, color: "bg-red-500" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="sentiment-panel">
      {/* Analyst Rating */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("sent.analystRating")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold ${rating.color}`}>
              {quote.recommendationMean !== null ? quote.recommendationMean.toFixed(1) : "N/A"}
            </div>
            <div>
              <div className={`font-semibold ${rating.color}`}>{rating.label}</div>
              <div className="text-xs text-muted-foreground">
                {quote.numberOfAnalystOpinions ?? 0} {t("sent.analysts")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("sent.distribution")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {distBars.map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0">{b.label}</span>
                <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                  <div
                    className={`h-full ${b.color} rounded transition-all`}
                    style={{ width: total > 0 ? `${(b.count / total) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums w-6 text-right">{b.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Target Price */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("sent.targetPrice")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t("sent.mean")}</span>
              <span className="text-sm font-medium tabular-nums">
                {quote.targetMeanPrice !== null ? `$${quote.targetMeanPrice.toFixed(2)}` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t("sent.high")}</span>
              <span className="text-sm font-medium tabular-nums">
                {quote.targetHighPrice !== null ? `$${quote.targetHighPrice.toFixed(2)}` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t("sent.low")}</span>
              <span className="text-sm font-medium tabular-nums">
                {quote.targetLowPrice !== null ? `$${quote.targetLowPrice.toFixed(2)}` : "N/A"}
              </span>
            </div>
            {quote.targetMeanPrice !== null && quote.regularMarketPrice !== null && (
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {quote.regularMarketPrice < quote.targetMeanPrice ? "↑" : "↓"} vs {t("tech.current")}
                  </span>
                  <Badge variant="outline" className={
                    quote.regularMarketPrice < quote.targetMeanPrice
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-500"
                  }>
                    {((quote.targetMeanPrice / quote.regularMarketPrice - 1) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Upgrades/Downgrades */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("sent.recentActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          {quote.recentUpgrades.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("noData")}</div>
          ) : (
            <div className="space-y-2">
              {quote.recentUpgrades.map((u, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                  <div>
                    <div className="font-medium">{u.firm}</div>
                    <div className="text-xs text-muted-foreground">
                      {getActionLabel(u.action, t)}: {u.fromGrade && `${u.fromGrade} → `}{u.toGrade}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{u.date}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
