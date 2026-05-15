import { NextResponse } from "next/server";
import { getQuote } from "@/lib/tradingview/client";
import { getServerWsFactory } from "@/lib/tradingview/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

function mapToYahoo(ticker: string): string[] {
  const map: Record<string, string[]> = {
    XAUUSD: ["GC=F", "XAUUSD=X", "GOLD"],
    BTCUSD: ["BTC-USD"],
    ETHUSD: ["ETH-USD"],
  };
  return map[ticker.toUpperCase()] || [ticker];
}

async function yahooPrice(ticker: string): Promise<number> {
  const tickersToTry = mapToYahoo(ticker);
  let lastError: Error | null = null;

  for (const t of tickersToTry) {
    try {
      const res = await fetch(
        `${YAHOO_CHART}/${encodeURIComponent(t)}?interval=1m&range=1d`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          cache: "no-store",
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const r = data?.chart?.result?.[0];
      const p =
        r?.meta?.regularMarketPrice ??
        r?.indicators?.quote?.[0]?.close?.filter((x: any) => x != null)?.slice(-1)?.[0];
      
      if (typeof p === "number" && p > 0) return p;
    } catch (e: any) {
      lastError = e;
    }
  }
  
  throw lastError || new Error("yahoo: sin precio tras agotar opciones");
}

export async function GET(
  _request: Request,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase();

  let price: number | null = null;
  let source: "tradingview" | "yahoo" | null = null;

  try {
    const tick = await getQuote(ticker, {
      timeoutMs: 2200,
      wsFactory: getServerWsFactory(),
    });
    price = tick.price;
    source = "tradingview";
  } catch {
    // fall through
  }

  if (price == null) {
    try {
      price = await yahooPrice(ticker);
      source = "yahoo";
    } catch (e: any) {
      return NextResponse.json(
        { error: `No se pudo obtener precio para ${ticker}` },
        { status: 503 }
      );
    }
  }

  // Persistir el tick (best-effort)
  try {
    const db = getServerSupabase();
    await db.from("market_ticks").insert({
      symbol: ticker,
      price,
      source: source ?? "unknown",
    });
  } catch {
    // ignorar errores de persistencia para no romper la respuesta live
  }

  return NextResponse.json(
    { price, source, ts: Date.now() },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
