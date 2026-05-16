/**
 * Datos de mercado para Vercel serverless.
 *
 * - getTickerData(): precio actual + algunos fundamentales. Primero intenta
 *   TradingView WS (instantáneo) y si falla cae a Yahoo Finance HTTP.
 * - getPriceHistory(): velas históricas vía Yahoo Finance (query1).
 * - calculateIndicators / interpretIndicators: portadas de
 *   backend/data/indicators.py.
 */

import { getQuote } from "./tradingview/client";
import { getServerWsFactory } from "./tradingview/server";

export type Candle = {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type TickerData = {
  price: number;
  market_cap?: number | null;
  pe_ratio?: number | null;
  eps?: number | null;
  beta?: number | null;
  dividend_yield?: number | null;
  source: "tradingview" | "yahoo" | "error";
};

const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_QUOTE = "https://query1.finance.yahoo.com/v7/finance/quote";

function mapToYahoo(ticker: string): string {
  const map: Record<string, string> = {
    XAUUSD: "GC=F",
    "GC=F": "GC=F",
    BTCUSD: "BTC-USD",
    ETHUSD: "ETH-USD",
  };
  return map[ticker.toUpperCase()] || ticker;
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn(`[marketData] fetch ${url} -> ${res.status}`);
    return null;
  }
  return await res.json();
}

/** Yahoo a veces incluye un dato fast en /chart con `meta.regularMarketPrice`. */
async function yahooFastPrice(ticker: string): Promise<number> {
  const mapped = mapToYahoo(ticker);
  const data = await fetchJson(
    `${YAHOO_CHART}/${encodeURIComponent(mapped)}?interval=1m&range=1d`
  );
  const price =
    data?.chart?.result?.[0]?.meta?.regularMarketPrice ??
    data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.slice(-1)?.[0];
  if (typeof price !== "number") throw new Error(`Yahoo: precio no disponible para ${ticker}`);
  return price;
}

async function yahooQuote(ticker: string): Promise<TickerData> {
  const mapped = mapToYahoo(ticker);
  const data = await fetchJson(`${YAHOO_QUOTE}?symbols=${encodeURIComponent(mapped)}`);
  const q = data?.quoteResponse?.result?.[0] ?? {};
  return {
    price: q.regularMarketPrice ?? (await yahooFastPrice(ticker)),
    market_cap: q.marketCap ?? null,
    pe_ratio: q.trailingPE ?? null,
    eps: q.epsTrailingTwelveMonths ?? null,
    beta: null,
    dividend_yield: q.trailingAnnualDividendYield ?? null,
    source: "yahoo",
  };
}

export async function getTickerData(ticker: string): Promise<TickerData> {
  // 1. Intento TradingView WS (instantáneo)
  try {
    const tick = await getQuote(ticker, {
      timeoutMs: 2500,
      wsFactory: getServerWsFactory(),
    });
    if (typeof tick.price === "number") {
      return {
        price: tick.price,
        source: "tradingview",
        market_cap: null,
        pe_ratio: null,
        eps: null,
        beta: null,
        dividend_yield: null,
      };
    }
  } catch {
    // fall through
  }
  // 2. Fallback Yahoo
  try {
    return await yahooQuote(ticker);
  } catch {
    try {
      const price = await yahooFastPrice(ticker);
      return { price, source: "yahoo" };
    } catch {
      console.warn(`[marketData] All price fallbacks failed for ${ticker}`);
      return { price: 0, source: "error" };
    }
  }
}

export async function getTickerNews(ticker: string): Promise<any[]> {
  try {
    const data = await fetchJson(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=5`);
    if (!data?.news) return [];
    return data.news.map((n: any) => ({
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      time: n.providerPublishTime
    }));
  } catch (e) {
    console.warn("[marketData] Error fetching news:", e);
    return [];
  }
}

export async function getPriceHistory(
  ticker: string,
  range: string = "3mo",
  interval: string = "1d"
): Promise<Candle[]> {
  const mapped = mapToYahoo(ticker);
  const data = await fetchJson(
    `${YAHOO_CHART}/${encodeURIComponent(mapped)}?range=${range}&interval=${interval}`
  );
  const result = data?.chart?.result?.[0];
  if (!result) return [];
  const timestamps: number[] = result.timestamp ?? [];
  const ind = result.indicators?.quote?.[0] ?? {};
  const out: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = ind.open?.[i];
    const h = ind.high?.[i];
    const l = ind.low?.[i];
    const c = ind.close?.[i];
    const v = ind.volume?.[i];
    if (o == null || h == null || l == null || c == null) continue;
    const d = new Date(timestamps[i] * 1000);
    const dateStr = d.toISOString().split("T")[0];
    out.push({
      time: dateStr,
      open: o,
      high: h,
      low: l,
      close: c,
      volume: v ?? 0,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Indicadores técnicos (port de backend/data/indicators.py)
// ---------------------------------------------------------------------------

export type Indicators = {
  price?: number;
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  ema_20?: number;
  ema_50?: number;
  ema_200?: number;
  bb_upper?: number;
  bb_lower?: number;
};

function ema(values: number[], length: number): (number | undefined)[] {
  const k = 2 / (length + 1);
  const out: (number | undefined)[] = new Array(values.length).fill(undefined);
  let prev: number | undefined;
  for (let i = 0; i < values.length; i++) {
    if (i < length - 1) continue;
    if (prev == null) {
      let sum = 0;
      for (let j = i - length + 1; j <= i; j++) sum += values[j];
      prev = sum / length;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out[i] = prev;
  }
  return out;
}

function rsi(values: number[], length = 14): (number | undefined)[] {
  const out: (number | undefined)[] = new Array(values.length).fill(undefined);
  if (values.length <= length) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / length;
  let avgLoss = loss / length;
  out[length] = 100 - 100 / (1 + avgGain / (avgLoss || 1e-9));
  for (let i = length + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (length - 1) + g) / length;
    avgLoss = (avgLoss * (length - 1) + l) / length;
    out[i] = 100 - 100 / (1 + avgGain / (avgLoss || 1e-9));
  }
  return out;
}

function bollinger(values: number[], length = 20, mult = 2) {
  const upper: (number | undefined)[] = new Array(values.length).fill(undefined);
  const lower: (number | undefined)[] = new Array(values.length).fill(undefined);
  for (let i = length - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - length + 1; j <= i; j++) sum += values[j];
    const mean = sum / length;
    let sq = 0;
    for (let j = i - length + 1; j <= i; j++) sq += (values[j] - mean) ** 2;
    const sd = Math.sqrt(sq / length);
    upper[i] = mean + mult * sd;
    lower[i] = mean - mult * sd;
  }
  return { upper, lower };
}

export function calculateIndicators(candles: Candle[]): Indicators {
  if (!candles.length) return {};
  const closes = candles.map((c) => c.close);
  const rsiVals = rsi(closes, 14);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = closes.map((_, i) => {
    const a = ema12[i];
    const b = ema26[i];
    return a != null && b != null ? a - b : undefined;
  });
  const macdSignal = ema(
    macdLine.map((v) => v ?? 0),
    9
  );
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const e200 = ema(closes, 200);
  const bb = bollinger(closes, 20, 2);
  const last = closes.length - 1;
  return {
    price: closes[last],
    rsi: rsiVals[last],
    macd: macdLine[last],
    macd_signal: macdSignal[last],
    ema_20: e20[last],
    ema_50: e50[last],
    ema_200: e200[last],
    bb_upper: bb.upper[last],
    bb_lower: bb.lower[last],
  };
}

export function interpretIndicators(data: Indicators): Record<string, string> {
  const out: Record<string, string> = {};
  const r = data.rsi;
  if (r != null) {
    if (r > 70) out.rsi = "SOBRECOMPRA";
    else if (r < 30) out.rsi = "SOBREVENTA";
    else out.rsi = "NEUTRAL";
  }
  const p = data.price;
  const e20 = data.ema_20;
  const e50 = data.ema_50;
  const e200 = data.ema_200;
  if (p != null && e20 != null && e50 != null && e200 != null) {
    if (p > e20 && e20 > e50 && e50 > e200) out.tendencia = "ALCISTA FUERTE";
    else if (p < e20 && e20 < e50 && e50 < e200) out.tendencia = "BAJISTA FUERTE";
    else if (p > e200) out.tendencia = "ALCISTA LARGO PLAZO";
    else out.tendencia = "RANGO/BAJISTA";
  }
  return out;
}
