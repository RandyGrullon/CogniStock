import { NextResponse } from "next/server";
import { getTickerData, getPriceHistory, getTickerNews, getMarketMovers } from "@/lib/marketData";

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
    // Fetch indices data and charts in parallel
    const indicesPromises = INDICES.map(async (idx) => {
      try {
        const data = await getTickerData(idx.symbol);
        const history = await getPriceHistory(idx.symbol, "1d", "15m");
        const price = data.price;
        let change = 0;
        let changePercent = 0;
        if (history.length > 0) {
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

    const sectorsPromises = SECTORS.map(async (sec) => {
      try {
        const data = await getTickerData(sec.symbol);
        return { symbol: sec.symbol, name: sec.name, changePercent: data.changePercent ?? 0, marketCap: data.marketCap ?? 10000000000 };
      } catch {
        return { symbol: sec.symbol, name: sec.name, changePercent: 0, marketCap: 10000000000 };
      }
    });

    const [indicesData, sectorsData, gainers, losers, actives, news] = await Promise.all([
      Promise.all(indicesPromises),
      Promise.all(sectorsPromises),
      getMarketMovers("day_gainers", 5),
      getMarketMovers("day_losers", 5),
      getMarketMovers("most_actives", 5),
      getTickerNews("SPY")
    ]);

    return NextResponse.json({
      assets: indicesData,
      sectors: sectorsData,
      movers: { gainers, losers, actives },
      news: news,
    });
  } catch (error: any) {
    console.error("Market Overview Error:", error);
    return NextResponse.json({ error: "Failed to fetch market overview" }, { status: 500 });
  }
}
