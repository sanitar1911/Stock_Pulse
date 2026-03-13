import type { Express } from "express";
import type { Server } from "http";

// --- Yahoo Finance crumb-based authentication ---
let crumb = "";
let cookies = "";

async function fetchCrumb() {
  try {
    // Step 1: Get cookies from fc.yahoo.com
    const cookieRes = await fetch("https://fc.yahoo.com", { redirect: "manual" });
    const setCookies = cookieRes.headers.getSetCookie?.() || [];
    cookies = setCookies.map((c: string) => c.split(";")[0]).join("; ");

    // Step 2: Get crumb using cookies
    const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { Cookie: cookies, "User-Agent": "Mozilla/5.0" },
    });
    crumb = await crumbRes.text();
    console.log("[Yahoo] Crumb refreshed:", crumb ? "OK" : "FAILED");
  } catch (e) {
    console.error("[Yahoo] Crumb fetch error:", e);
  }
}

// Fetch crumb on startup and refresh every 30 minutes
fetchCrumb();
setInterval(fetchCrumb, 30 * 60 * 1000);

export function registerRoutes(server: Server, app: Express): void {
  // --- Search stocks ---
  app.get("/api/search", async (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.json([]);
    try {
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0&listsCount=0`;
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const data = await r.json();
      const quotes = (data.quotes || [])
        .filter((q: any) => q.quoteType === "EQUITY" && q.exchange)
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          exchange: q.exchange,
          type: q.quoteType,
        }));
      res.json(quotes);
    } catch (e) {
      console.error("[Search]", e);
      res.json([]);
    }
  });

  // --- Get stock quote (quoteSummary with crumb) ---
  app.get("/api/quote/:symbol", async (req, res) => {
    const { symbol } = req.params;
    try {
      const modules = "price,summaryDetail,defaultKeyStatistics,financialData,recommendationTrend,upgradeDowngradeHistory";
      const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
      const r = await fetch(url, {
        headers: { Cookie: cookies, "User-Agent": "Mozilla/5.0" },
      });
      if (!r.ok) {
        // Try refreshing crumb once
        await fetchCrumb();
        const r2 = await fetch(
          `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`,
          { headers: { Cookie: cookies, "User-Agent": "Mozilla/5.0" } }
        );
        if (!r2.ok) return res.status(r2.status).json({ error: "Failed to fetch quote" });
        const data2 = await r2.json();
        return res.json(transformQuote(data2, symbol));
      }
      const data = await r.json();
      res.json(transformQuote(data, symbol));
    } catch (e) {
      console.error("[Quote]", e);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // --- Get OHLCV chart data (no auth needed) ---
  app.get("/api/chart/:symbol", async (req, res) => {
    const { symbol } = req.params;
    const range = (req.query.range as string) || "6mo";
    const interval = (req.query.interval as string) || "1d";
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const data = await r.json();
      const result = data.chart?.result?.[0];
      if (!result) return res.json([]);

      const timestamps = result.timestamp || [];
      const ohlcv = result.indicators?.quote?.[0] || {};
      const candles = timestamps.map((t: number, i: number) => ({
        time: t,
        open: ohlcv.open?.[i] ?? null,
        high: ohlcv.high?.[i] ?? null,
        low: ohlcv.low?.[i] ?? null,
        close: ohlcv.close?.[i] ?? null,
        volume: ohlcv.volume?.[i] ?? null,
      })).filter((c: any) => c.close !== null);

      res.json(candles);
    } catch (e) {
      console.error("[Chart]", e);
      res.json([]);
    }
  });
}

// Transform Yahoo quoteSummary response to a clean format
function transformQuote(data: any, symbol: string) {
  const result = data.quoteSummary?.result?.[0];
  if (!result) return null;

  const price = result.price || {};
  const summary = result.summaryDetail || {};
  const keyStats = result.defaultKeyStatistics || {};
  const financial = result.financialData || {};
  const recTrend = result.recommendationTrend?.trend || [];
  const upgrades = result.upgradeDowngradeHistory?.history || [];

  const val = (obj: any) => {
    if (!obj) return null;
    if (typeof obj === "number") return obj;
    if (obj.raw !== undefined) return obj.raw;
    if (obj.fmt !== undefined) return null;
    return null;
  };

  // Recommendation trend (current period)
  const currentRec = recTrend.find((t: any) => t.period === "0m") || {};

  // Recent upgrades/downgrades (last 5)
  const recentUpgrades = upgrades.slice(0, 5).map((u: any) => ({
    firm: u.firm || "Unknown",
    toGrade: u.toGrade || "",
    fromGrade: u.fromGrade || "",
    action: u.action || "",
    date: u.epochGradeDate ? new Date(u.epochGradeDate * 1000).toISOString().split("T")[0] : "",
  }));

  return {
    symbol,
    name: price.shortName || price.longName || symbol,
    currency: price.currency || "USD",
    exchange: price.exchangeName || "",
    marketState: price.marketState || "",
    regularMarketPrice: val(price.regularMarketPrice),
    regularMarketChange: val(price.regularMarketChange),
    regularMarketChangePercent: val(price.regularMarketChangePercent),
    regularMarketVolume: val(price.regularMarketVolume),
    regularMarketDayHigh: val(price.regularMarketDayHigh),
    regularMarketDayLow: val(price.regularMarketDayLow),
    regularMarketOpen: val(price.regularMarketOpen),
    regularMarketPreviousClose: val(price.regularMarketPreviousClose),
    fiftyTwoWeekHigh: val(summary.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: val(summary.fiftyTwoWeekLow),
    marketCap: val(price.marketCap),
    pe: val(summary.trailingPE),
    forwardPe: val(summary.forwardPE ?? keyStats.forwardPE),
    eps: val(keyStats.trailingEps),
    beta: val(summary.beta ?? keyStats.beta),
    dividendYield: val(summary.dividendYield),
    dividendRate: val(summary.dividendRate),
    targetMeanPrice: val(financial.targetMeanPrice),
    targetHighPrice: val(financial.targetHighPrice),
    targetLowPrice: val(financial.targetLowPrice),
    recommendationMean: val(financial.recommendationMean),
    recommendationKey: financial.recommendationKey || null,
    numberOfAnalystOpinions: val(financial.numberOfAnalystOpinions),
    profitMargins: val(financial.profitMargins ?? keyStats.profitMargins),
    returnOnEquity: val(financial.returnOnEquity),
    revenueGrowth: val(financial.revenueGrowth),
    earningsGrowth: val(financial.earningsGrowth),
    debtToEquity: val(financial.debtToEquity),
    currentRatio: val(financial.currentRatio),
    totalRevenue: val(financial.totalRevenue),
    grossMargins: val(financial.grossMargins),
    operatingMargins: val(financial.operatingMargins),
    strongBuy: currentRec.strongBuy || 0,
    buy: currentRec.buy || 0,
    hold: currentRec.hold || 0,
    sell: currentRec.sell || 0,
    strongSell: currentRec.strongSell || 0,
    recentUpgrades,
  };
}
