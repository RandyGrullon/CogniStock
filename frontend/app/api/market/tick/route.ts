import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type TickPayload = { symbol: string; price: number; ts?: number; source?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { ticks?: TickPayload[] } | TickPayload[];
    const ticks: TickPayload[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.ticks)
      ? body.ticks
      : [];
    if (!ticks.length) return NextResponse.json({ inserted: 0 });

    const db = getServerSupabase();
    const rows = ticks
      .filter((t) => t && typeof t.symbol === "string" && typeof t.price === "number")
      .map((t) => ({
        symbol: t.symbol.toUpperCase(),
        price: t.price,
        source: t.source ?? "tradingview",
        ts: t.ts ? new Date(t.ts).toISOString() : undefined,
      }));
    if (!rows.length) return NextResponse.json({ inserted: 0 });

    const { error } = await db.from("market_ticks").insert(rows as any);
    if (error) throw error;
    return NextResponse.json({ inserted: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "tick insert failed" }, { status: 500 });
  }
}
