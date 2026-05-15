import { NextResponse } from "next/server";
import { getTrades } from "@/lib/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const estado = url.searchParams.get("estado") as "OPEN" | "CLOSED" | null;
    const ticker = url.searchParams.get("ticker") || undefined;
    const trades = await getTrades({
      estado: estado ?? undefined,
      ticker,
    });
    return NextResponse.json(trades, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
