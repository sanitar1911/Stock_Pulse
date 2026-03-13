import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  BarChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import type { Candle } from "@/lib/finnhub";

const ranges = [
  { key: "1d", interval: "5m" },
  { key: "5d", interval: "15m" },
  { key: "1mo", interval: "1d" },
  { key: "3mo", interval: "1d" },
  { key: "6mo", interval: "1d" },
  { key: "1y", interval: "1wk" },
  { key: "2y", interval: "1wk" },
  { key: "5y", interval: "1mo" },
];

export default function CandlestickChart({ symbol }: { symbol: string }) {
  const t = useT();
  const [rangeIdx, setRangeIdx] = useState(4); // default 6mo
  const r = ranges[rangeIdx];

  const { data: candles = [], isLoading } = useQuery<Candle[]>({
    queryKey: ["/api/chart/" + symbol, r.key, r.interval],
    queryFn: async () => {
      const res = await fetch(`/api/chart/${symbol}?range=${r.key}&interval=${r.interval}`);
      return res.json();
    },
    refetchInterval: 60000,
  });

  const chartData = candles.map((c) => {
    const date = new Date(c.time * 1000);
    const label =
      r.interval === "5m" || r.interval === "15m"
        ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : date.toLocaleDateString([], { month: "short", day: "numeric" });
    const isUp = c.close >= c.open;
    return {
      date: label,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      // For candlestick-like display with bars
      bodyBottom: Math.min(c.open, c.close),
      bodyHeight: Math.abs(c.close - c.open),
      color: isUp ? "#10b981" : "#ef4444",
      fill: isUp ? "#10b981" : "#ef4444",
    };
  });

  const prices = chartData.map((d) => [d.low, d.high]).flat().filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) * 0.998 : 0;
  const maxPrice = prices.length ? Math.max(...prices) * 1.002 : 100;

  return (
    <Card data-testid="candlestick-chart">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t("chart.title")}</CardTitle>
          <div className="flex gap-1">
            {ranges.map((rng, i) => (
              <Button
                key={rng.key}
                variant={i === rangeIdx ? "default" : "ghost"}
                size="sm"
                className="text-xs px-2 h-7"
                data-testid={`button-range-${rng.key}`}
                onClick={() => setRangeIdx(i)}
              >
                {t(`chart.range.${rng.key}`)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">{t("loading")}</div>
        ) : (
          <div className="space-y-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    interval="preserveStartEnd"
                    tickLine={false}
                  />
                  <YAxis
                    domain={[minPrice, maxPrice]}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => v.toFixed(1)}
                    width={60}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                  />
                  <Line type="monotone" dataKey="close" stroke="#6366f1" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="high" stroke="#10b981" dot={false} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
                  <Line type="monotone" dataKey="low" stroke="#ef4444" dot={false} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
                  <XAxis dataKey="date" tick={false} tickLine={false} axisLine={false} />
                  <YAxis tick={false} tickLine={false} axisLine={false} width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [value.toLocaleString(), t("chart.volume")]}
                  />
                  <Bar dataKey="volume" fill="#6366f1" opacity={0.4} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
