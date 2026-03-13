// Technical indicators calculation & signal generation
import type { Locale } from "./i18n";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalData {
  sma5: number | null;
  sma10: number | null;
  sma20: number | null;
  sma60: number | null;
  rsi: number | null;
  macdLine: number | null;
  signalLine: number | null;
  histogram: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  currentPrice: number;
}

export type SignalLevel = "strongBuy" | "buy" | "neutral" | "sell" | "strongSell";

export interface SignalResult {
  overall: SignalLevel;
  techSignal: SignalLevel;
  fundSignal: SignalLevel;
  sentSignal: SignalLevel;
  score: number;
  reasons: string[]; // i18n keys
}

function sma(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// Wilder's smoothing RSI
function calcRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Wilder's smoothing for remaining data
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcMACD(closes: number[]): { macd: number; signal: number; histogram: number } | null {
  if (closes.length < 35) return null;

  const ema = (data: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  };

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]).slice(25);
  const signalLine = ema(macdLine, 9);

  const macd = macdLine[macdLine.length - 1];
  const signal = signalLine[signalLine.length - 1];
  return { macd, signal, histogram: macd - signal };
}

function calcBollinger(closes: number[], period = 20): { upper: number; middle: number; lower: number } | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  return { upper: mean + 2 * std, middle: mean, lower: mean - 2 * std };
}

export function calculateTechnicals(candles: Candle[]): TechnicalData {
  const closes = candles.map((c) => c.close);
  const current = closes[closes.length - 1] || 0;
  const macd = calcMACD(closes);
  const bollinger = calcBollinger(closes);

  return {
    sma5: sma(closes, 5),
    sma10: sma(closes, 10),
    sma20: sma(closes, 20),
    sma60: sma(closes, 60),
    rsi: calcRSI(closes),
    macdLine: macd?.macd ?? null,
    signalLine: macd?.signal ?? null,
    histogram: macd?.histogram ?? null,
    bollingerUpper: bollinger?.upper ?? null,
    bollingerMiddle: bollinger?.middle ?? null,
    bollingerLower: bollinger?.lower ?? null,
    currentPrice: current,
  };
}

export interface QuoteData {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  marketState: string;
  regularMarketPrice: number | null;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
  regularMarketVolume: number | null;
  regularMarketDayHigh: number | null;
  regularMarketDayLow: number | null;
  regularMarketOpen: number | null;
  regularMarketPreviousClose: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  marketCap: number | null;
  pe: number | null;
  forwardPe: number | null;
  eps: number | null;
  beta: number | null;
  dividendYield: number | null;
  dividendRate: number | null;
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  recommendationMean: number | null;
  recommendationKey: string | null;
  numberOfAnalystOpinions: number | null;
  profitMargins: number | null;
  returnOnEquity: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  totalRevenue: number | null;
  grossMargins: number | null;
  operatingMargins: number | null;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  recentUpgrades: Array<{
    firm: string;
    toGrade: string;
    fromGrade: string;
    action: string;
    date: string;
  }>;
}

export function generateSignal(tech: TechnicalData, quote: QuoteData | null): SignalResult {
  let techScore = 0;
  let fundScore = 0;
  let sentScore = 0;
  const reasons: string[] = [];

  // --- Technical signals ---
  // RSI
  if (tech.rsi !== null) {
    if (tech.rsi < 30) {
      techScore += 2;
      reasons.push("reason.rsi_oversold");
    } else if (tech.rsi > 70) {
      techScore -= 2;
      reasons.push("reason.rsi_overbought");
    } else {
      reasons.push("reason.rsi_neutral");
    }
  }

  // MACD
  if (tech.histogram !== null) {
    if (tech.histogram > 0) {
      techScore += 1;
      reasons.push("reason.macd_bullish");
    } else {
      techScore -= 1;
      reasons.push("reason.macd_bearish");
    }
  }

  // Price vs SMA20
  if (tech.sma20 !== null) {
    if (tech.currentPrice > tech.sma20) {
      techScore += 1;
      reasons.push("reason.price_above_sma20");
    } else {
      techScore -= 1;
      reasons.push("reason.price_below_sma20");
    }
  }

  // Bollinger
  if (tech.bollingerLower !== null && tech.bollingerUpper !== null) {
    const range = tech.bollingerUpper - tech.bollingerLower;
    if (range > 0) {
      if (tech.currentPrice <= tech.bollingerLower + range * 0.1) {
        techScore += 1;
        reasons.push("reason.price_near_bollinger_lower");
      } else if (tech.currentPrice >= tech.bollingerUpper - range * 0.1) {
        techScore -= 1;
        reasons.push("reason.price_near_bollinger_upper");
      }
    }
  }

  if (quote) {
    // --- Fundamental signals ---
    if (quote.pe !== null && quote.pe > 0) {
      if (quote.pe < 15) {
        fundScore += 2;
        reasons.push("reason.pe_undervalued");
      } else if (quote.pe > 30) {
        fundScore -= 1;
        reasons.push("reason.pe_overvalued");
      }
    } else {
      reasons.push("reason.pe_na");
    }

    if (quote.profitMargins !== null) {
      if (quote.profitMargins > 0.15) {
        fundScore += 1;
        reasons.push("reason.high_profit_margin");
      } else if (quote.profitMargins < 0.05) {
        fundScore -= 1;
        reasons.push("reason.low_profit_margin");
      }
    }

    if (quote.revenueGrowth !== null) {
      if (quote.revenueGrowth > 0.05) {
        fundScore += 1;
        reasons.push("reason.strong_revenue_growth");
      } else if (quote.revenueGrowth < 0) {
        fundScore -= 1;
        reasons.push("reason.negative_revenue_growth");
      }
    }

    if (quote.debtToEquity !== null) {
      if (quote.debtToEquity < 100) {
        fundScore += 1;
        reasons.push("reason.healthy_balance_sheet");
      } else if (quote.debtToEquity > 200) {
        fundScore -= 1;
        reasons.push("reason.high_debt");
      }
    }

    // --- Sentiment signals ---
    const totalRec = quote.strongBuy + quote.buy + quote.hold + quote.sell + quote.strongSell;
    if (totalRec > 0) {
      const bullish = quote.strongBuy + quote.buy;
      const bearish = quote.sell + quote.strongSell;
      if (bullish > totalRec * 0.6) {
        sentScore += 2;
        reasons.push("reason.analyst_bullish");
      } else if (bearish > totalRec * 0.4) {
        sentScore -= 2;
        reasons.push("reason.analyst_bearish");
      } else {
        reasons.push("reason.analyst_neutral");
      }
    }

    if (quote.targetMeanPrice !== null && quote.regularMarketPrice !== null) {
      if (quote.regularMarketPrice < quote.targetMeanPrice * 0.95) {
        sentScore += 1;
        reasons.push("reason.price_below_target");
      } else if (quote.regularMarketPrice > quote.targetMeanPrice * 1.05) {
        sentScore -= 1;
        reasons.push("reason.price_above_target");
      }
    }
  }

  const totalScore = techScore + fundScore + sentScore;

  const toLevel = (s: number): SignalLevel => {
    if (s >= 3) return "strongBuy";
    if (s >= 1) return "buy";
    if (s <= -3) return "strongSell";
    if (s <= -1) return "sell";
    return "neutral";
  };

  return {
    overall: toLevel(totalScore),
    techSignal: toLevel(techScore),
    fundSignal: toLevel(fundScore),
    sentSignal: toLevel(sentScore),
    score: totalScore,
    reasons,
  };
}
