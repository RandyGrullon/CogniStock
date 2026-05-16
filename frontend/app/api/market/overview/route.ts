import { NextResponse } from "next/server";
import { getTickerData, getPriceHistory, getTickerNews } from "@/lib/marketData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INDICES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^VIX", name: "VIX" },
];

export async function GET() {
  try {
    // Fetch indices data and charts in parallel
    const indicesPromises = INDICES.map(async (idx) => {
      try {
        const data = await getTickerData(idx.symbol);
        const history = await getPriceHistory(idx.symbol, "1d", "15m");
        const price = data.price;
        // Calculate change (using first candle of the day vs current)
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
        console.warn(`Failed to fetch ${idx.symbol}:`, e);
        return {
          symbol: idx.symbol,
          name: idx.name,
          price: 0,
          change: 0,
          changePercent: 0,
          chart: [],
        };
      }
    });

    const indicesData = await Promise.all(indicesPromises);

    // Fetch market news (we can use SPY or a general market ticker to get broader news)
    const news = await getTickerNews("SPY");

    return NextResponse.json({
      assets: indicesData,
      news: news,
    });
  } catch (error: any) {
    console.error("Market Overview Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market overview" },
      { status: 500 }
    );
  }
}
