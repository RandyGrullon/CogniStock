import { NextResponse } from "next/server";
import { getTickerData, getPriceHistory, getTickerNews, getMarketMovers, getBatchQuotes } from "@/lib/marketData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INDICES = [
  { symbol: "^GSPC", name: "S&P Futures" },
  { symbol: "^IXIC", name: "NASDAQ Fut." },
  { symbol: "^DJI", name: "Dow Futures" },
  { symbol: "^VIX", name: "VIX" },
];

const SECTORS = [
  { symbol: "XLK", name: "Technology" },
  { symbol: "XLF", name: "Financials" },
  { symbol: "XLV", name: "Health Care" },
  { symbol: "XLY", name: "Consumer Cyclical" },
  { symbol: "XLC", name: "Communication" },
  { symbol: "XLI", name: "Industrials" },
  { symbol: "XLP", name: "Consumer Staples" },
  { symbol: "XLE", name: "Energy" },
  { symbol: "XLU", name: "Utilities" },
  { symbol: "XLRE", name: "Real Estate" },
  { symbol: "XLB", name: "Materials" },
];

export async function GET() {
  try {
    // Batch fetch all current quotes (Indices + Sectors) to save API calls
    const allSymbols = [...INDICES.map(i => i.symbol), ...SECTORS.map(s => s.symbol)];
    const batchedQuotes = await getBatchQuotes(allSymbols);

    // Fetch indices data and charts in parallel
    const indicesPromises = INDICES.map(async (idx) => {
      try {
        const quote = batchedQuotes[idx.symbol];
        const history = await getPriceHistory(idx.symbol, "1d", "15m");
        const price = quote?.price ?? 0;
        let change = quote?.change ?? 0;
        let changePercent = quote?.changePercent ?? 0;
        if (history.length > 0 && !change) {
          const openPrice = history[0].open;
          change = price - openPrice;
          changePercent = (change / openPrice) * 100;
        }

        return {
          symbol: idx.symbol,
          name: idx.name,
          price,
          change,
          changePercent,
          chart: history.map((c) => c.close),
        };
      } catch (e) {
        return { symbol: idx.symbol, name: idx.name, price: 0, change: 0, changePercent: 0, chart: [] };
      }
    });

    const sectorsData = SECTORS.map((sec) => {
      const quote = batchedQuotes[sec.symbol];
      return { 
        symbol: sec.symbol, 
        name: sec.name, 
        changePercent: quote?.changePercent ?? 0, 
        marketCap: quote?.market_cap ?? 10000000000 
      };
    });

    const [indicesDataResolved, gainers, losers, actives, news] = await Promise.all([
      Promise.all(indicesPromises),
      getMarketMovers("day_gainers", 5),
      getMarketMovers("day_losers", 5),
      getMarketMovers("most_actives", 5),
      getTickerNews("SPY")
    ]);

    return NextResponse.json({
      assets: indicesDataResolved,
      sectors: sectorsData,
      movers: { gainers, losers, actives },
      news: news,
    });
  } catch (error: any) {
    console.error("Market Overview Error:", error);
    return NextResponse.json({ error: "Failed to fetch market overview" }, { status: 500 });
  }
}
