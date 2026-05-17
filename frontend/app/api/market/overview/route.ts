import { NextResponse } from "next/server";
import { getPriceHistory, getTickerNews, getMarketMovers, getBatchQuotes } from "@/lib/marketData";
import { generateAIMarketOverview } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    // 1. Fetch deep market data for AI context
    const [gainersRaw, losersRaw, activesRaw, news] = await Promise.all([
      getMarketMovers("day_gainers", 15),
      getMarketMovers("day_losers", 15),
      getMarketMovers("most_actives", 15),
      getTickerNews("SPY")
    ]);

    // 2. AI orchestrates the entire dashboard logic
    const aiResult = await generateAIMarketOverview({ 
      gainers: gainersRaw, 
      losers: losersRaw, 
      actives: activesRaw, 
      news 
    });

    // 3. Extract all symbols mentioned by AI to fetch their real-time quotes
    const aiTopSymbols = aiResult.top_assets.map(a => a.symbol);
    const aiGainerSymbols = aiResult.movers_analysis.gainers.map(a => a.symbol);
    const aiLoserSymbols = aiResult.movers_analysis.losers.map(a => a.symbol);
    const aiActiveSymbols = aiResult.movers_analysis.actives.map(a => a.symbol);

    const allSymbolsToFetch = Array.from(new Set([
      ...aiTopSymbols,
      ...aiGainerSymbols,
      ...aiLoserSymbols,
      ...aiActiveSymbols,
      ...SECTORS.map(s => s.symbol)
    ]));

    // 4. Batch fetch real-time quotes (TV + Yahoo fallback)
    const batchedQuotes = await getBatchQuotes(allSymbolsToFetch);

    // 5. Construct Top Assets with AI reasoning and Real Percentages
    const topAssetsPromises = aiResult.top_assets.map(async (asset) => {
      try {
        const quote = batchedQuotes[asset.symbol];
        const history = await getPriceHistory(asset.symbol, "1d", "15m");
        const price = quote?.price ?? 0;
        let change = quote?.change ?? 0;
        let changePercent = quote?.changePercent ?? 0;

        // Fallback calculation for percentages if API is missing them
        if (history.length > 0 && (changePercent === 0 || changePercent === null)) {
          const openPrice = history[0].open;
          change = price - openPrice;
          changePercent = (change / openPrice) * 100;
        }

        return {
          symbol: asset.symbol,
          name: asset.symbol,
          price,
          change,
          changePercent,
          reason: asset.reason,
          chart: history.map((c) => c.close),
          source: quote?.source || 'yahoo'
        };
      } catch (e) {
        return { symbol: asset.symbol, name: asset.symbol, price: 0, change: 0, changePercent: 0, chart: [], reason: asset.reason };
      }
    });

    // 6. Map AI-commented Movers with real-time prices
    const mapMover = (aiMovers: any[]) => aiMovers.map(am => {
      const q = batchedQuotes[am.symbol];
      return {
        symbol: am.symbol,
        name: am.symbol,
        price: q?.price ?? 0,
        percent: q?.changePercent ?? 0,
        ai_comment: am.ai_comment
      };
    });

    const [topAssets, sectorsData] = await Promise.all([
      Promise.all(topAssetsPromises),
      Promise.resolve(SECTORS.map(sec => {
        const q = batchedQuotes[sec.symbol];
        return { 
          symbol: sec.symbol, 
          name: sec.name, 
          changePercent: q?.changePercent ?? 0, 
          marketCap: q?.market_cap ?? 0
        };
      }))
    ]);

    return NextResponse.json({
      assets: topAssets,
      sectors: sectorsData,
      movers: { 
        gainers: mapMover(aiResult.movers_analysis.gainers), 
        losers: mapMover(aiResult.movers_analysis.losers), 
        actives: mapMover(aiResult.movers_analysis.actives) 
      },
      news: news,
      aiSummary: aiResult.summary
    });
  } catch (error: any) {
    console.error("Market Overview Error:", error);
    return NextResponse.json({ error: "Failed to fetch market overview" }, { status: 500 });
  }
}
