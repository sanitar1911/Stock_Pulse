import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Landmark, Users, Signal } from "lucide-react";
import SearchBar from "@/components/stock/SearchBar";
import LanguageSwitcher from "@/components/stock/LanguageSwitcher";
import QuoteHeader from "@/components/stock/QuoteHeader";
import CandlestickChart from "@/components/stock/CandlestickChart";
import TechnicalIndicators from "@/components/stock/TechnicalIndicators";
import FundamentalsPanel from "@/components/stock/FundamentalsPanel";
import SentimentPanel from "@/components/stock/SentimentPanel";
import SignalPanel from "@/components/stock/SignalPanel";
import { calculateTechnicals, generateSignal, type QuoteData, type Candle } from "@/lib/finnhub";
import { useT } from "@/lib/i18n";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

export default function StockDashboard() {
  const t = useT();
  const [symbol, setSymbol] = useState("AAPL");

  const { data: quote, isLoading: quoteLoading } = useQuery<QuoteData>({
    queryKey: ["/api/quote", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/quote/${symbol}`);
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: candles = [] } = useQuery<Candle[]>({
    queryKey: ["/api/chart/" + symbol, "6mo", "1d"],
    queryFn: async () => {
      const res = await fetch(`/api/chart/${symbol}?range=6mo&interval=1d`);
      return res.json();
    },
    refetchInterval: 60000,
  });

  const technicals = candles.length > 0 ? calculateTechnicals(candles) : null;
  const signal = technicals ? generateSignal(technicals, quote || null) : null;

  return (
    <div className="min-h-screen bg-background" data-testid="stock-dashboard">
      {/* Header bar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold hidden sm:block">{t("header.title")}</h1>
          </div>
          <SearchBar onSelect={setSymbol} />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {quoteLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">{t("loading")}</div>
        ) : quote ? (
          <>
            <QuoteHeader quote={quote} />

            <Tabs defaultValue="chart" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="chart" className="gap-1.5" data-testid="tab-chart">
                  <BarChart3 className="h-4 w-4 hidden sm:inline" />
                  {t("tab.chart")}
                </TabsTrigger>
                <TabsTrigger value="technical" className="gap-1.5" data-testid="tab-technical">
                  <TrendingUp className="h-4 w-4 hidden sm:inline" />
                  {t("tab.technical")}
                </TabsTrigger>
                <TabsTrigger value="fundamentals" className="gap-1.5" data-testid="tab-fundamentals">
                  <Landmark className="h-4 w-4 hidden sm:inline" />
                  {t("tab.fundamentals")}
                </TabsTrigger>
                <TabsTrigger value="sentiment" className="gap-1.5" data-testid="tab-sentiment">
                  <Users className="h-4 w-4 hidden sm:inline" />
                  {t("tab.sentiment")}
                </TabsTrigger>
                <TabsTrigger value="signal" className="gap-1.5" data-testid="tab-signal">
                  <Signal className="h-4 w-4 hidden sm:inline" />
                  {t("tab.signal")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chart">
                <CandlestickChart symbol={symbol} />
              </TabsContent>
              <TabsContent value="technical">
                {technicals ? (
                  <TechnicalIndicators data={technicals} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>
                )}
              </TabsContent>
              <TabsContent value="fundamentals">
                <FundamentalsPanel quote={quote} />
              </TabsContent>
              <TabsContent value="sentiment">
                <SentimentPanel quote={quote} />
              </TabsContent>
              <TabsContent value="signal">
                {signal ? (
                  <SignalPanel signal={signal} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">{t("error")}</div>
        )}
      </main>

      <PerplexityAttribution />
    </div>
  );
}
