import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1"
];

function mapToYahoo(ticker: string): string {
  const map: Record<string, string> = {
    XAUUSD: "GC=F",
    "GC=F": "GC=F",
    BTCUSD: "BTC-USD",
    ETHUSD: "ETH-USD",
  };
  return map[ticker.toUpperCase()] || ticker;
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const res = await fetch(url, {
      headers: {
        "User-Agent": ua,
        "Accept": "application/json",
        "Referer": "https://finance.yahoo.com/",
      },
      cache: "no-store",
    });
    
    if (res.status !== 429 || i === retries) return res;
    
    // Espera exponencial breve (500ms, 1000ms...)
    await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)));
  }
  throw new Error("Rate limit exceeded after retries");
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
    const targetUrl = `${YAHOO_CHART}/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`;
    const res = await fetchWithRetry(targetUrl);
    
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
      out.push({ time: ts[i], open: o, high: h, low: l, close: c });
    }
    
    return NextResponse.json(out, {
      headers: { 
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" 
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `Error de datos para ${ticker}: ${e?.message ?? e}` },
      { status: 503 }
    );
  }
}
