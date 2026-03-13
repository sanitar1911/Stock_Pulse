import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TechnicalData } from "@/lib/finnhub";
import { useT } from "@/lib/i18n";

function fmtNum(v: number | null, decimals = 2): string {
  if (v === null) return "N/A";
  return v.toFixed(decimals);
}

export default function TechnicalIndicators({ data }: { data: TechnicalData }) {
  const t = useT();

  const rsiColor =
    data.rsi !== null
      ? data.rsi > 70
        ? "text-red-500"
        : data.rsi < 30
        ? "text-emerald-500"
        : "text-foreground"
      : "";

  const rsiLabel =
    data.rsi !== null
      ? data.rsi > 70
        ? t("tech.overbought")
        : data.rsi < 30
        ? t("tech.oversold")
        : t("tech.neutral")
      : "";

  const macdSignal =
    data.histogram !== null
      ? data.histogram > 0
        ? { label: t("tech.bullish"), color: "bg-emerald-500/10 text-emerald-500" }
        : { label: t("tech.bearish"), color: "bg-red-500/10 text-red-500" }
      : null;

  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="technical-indicators">
      {/* Moving Averages */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("tech.ma")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: t("tech.sma5"), value: data.sma5 },
              { label: t("tech.sma10"), value: data.sma10 },
              { label: t("tech.sma20"), value: data.sma20 },
              { label: t("tech.sma60"), value: data.sma60 },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium tabular-nums">${fmtNum(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1 border-t border-border">
              <span className="text-sm font-medium">{t("tech.current")}</span>
              <span className="text-sm font-bold tabular-nums">${fmtNum(data.currentPrice)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RSI */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("tech.rsi")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className={`text-3xl font-bold tabular-nums ${rsiColor}`}>
                {fmtNum(data.rsi, 1)}
              </span>
              {rsiLabel && <span className={`text-sm ${rsiColor}`}>{rsiLabel}</span>}
            </div>
            {data.rsi !== null && (
              <div className="space-y-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      data.rsi > 70 ? "bg-red-500" : data.rsi < 30 ? "bg-emerald-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${data.rsi}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>30</span>
                  <span>50</span>
                  <span>70</span>
                  <span>100</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MACD */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("tech.macd")}</CardTitle>
            {macdSignal && (
              <Badge variant="outline" className={macdSignal.color}>
                {macdSignal.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("tech.macdLine")}</span>
              <span className="text-sm font-medium tabular-nums">{fmtNum(data.macdLine, 4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("tech.signalLine")}</span>
              <span className="text-sm font-medium tabular-nums">{fmtNum(data.signalLine, 4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("tech.histogram")}</span>
              <span className={`text-sm font-medium tabular-nums ${
                data.histogram !== null ? (data.histogram > 0 ? "text-emerald-500" : "text-red-500") : ""
              }`}>
                {fmtNum(data.histogram, 4)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bollinger Bands */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("tech.bollinger")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("tech.upper")}</span>
              <span className="text-sm font-medium tabular-nums">${fmtNum(data.bollingerUpper)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("tech.middle")}</span>
              <span className="text-sm font-medium tabular-nums">${fmtNum(data.bollingerMiddle)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("tech.lower")}</span>
              <span className="text-sm font-medium tabular-nums">${fmtNum(data.bollingerLower)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-border">
              <span className="text-sm font-medium">{t("tech.current")}</span>
              <span className="text-sm font-bold tabular-nums">${fmtNum(data.currentPrice)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
