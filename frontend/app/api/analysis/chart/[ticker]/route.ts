import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

function mapToYahoo(ticker: string): string {
  const map: Record<string, string> = {
    XAUUSD: "GC=F",
    "GC=F": "GC=F",
    BTCUSD: "BTC-USD",
    ETHUSD: "ETH-USD",
  };
  return map[ticker.toUpperCase()] || ticker;
}

export async function GET(
  req: Request,
  { params }: { params: { ticker: string } }
) {
  const rawTicker = params.ticker;
  const ticker = mapToYahoo(rawTicker);
  const url = new URL(req.url);
  const range = url.searchParams.get("range") ?? "3mo";
  const interval = url.searchParams.get("interval") ?? "1d";

  try {
    const res = await fetch(
      `${YAHOO_CHART}/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error(`yahoo ${res.status}`);
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return NextResponse.json([], { status: 200 });
    const ts: number[] = result.timestamp ?? [];
    const ind = result.indicators?.quote?.[0] ?? {};
    const out: any[] = [];
    for (let i = 0; i < ts.length; i++) {
      const o = ind.open?.[i];
      const h = ind.high?.[i];
      const l = ind.low?.[i];
      const c = ind.close?.[i];
      if (o == null || h == null || l == null || c == null) continue;
      const d = new Date(ts[i] * 1000);
      const dateStr = d.toISOString().split("T")[0];
      out.push({ time: dateStr, open: o, high: h, low: l, close: c });
    }
    return NextResponse.json(out, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `No se pudo obtener histórico para ${ticker}: ${e?.message ?? e}` },
      { status: 503 }
    );
  }
}
