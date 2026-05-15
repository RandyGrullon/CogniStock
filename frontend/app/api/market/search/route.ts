import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const YAHOO_SEARCH = "https://query1.finance.yahoo.com/v1/finance/search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(`${YAHOO_SEARCH}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    if (!res.ok) throw new Error(`Yahoo Search failed: ${res.status}`);
    
    const data = await res.json();
    const results = (data.quotes || [])
      .filter((q: any) => q.isYahooFinance && (q.quoteType === "EQUITY" || q.quoteType === "CRYPTOCURRENCY" || q.quoteType === "INDEX" || q.quoteType === "ETF"))
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType,
        exch: q.exchDisp
      }));

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
