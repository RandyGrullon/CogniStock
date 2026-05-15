import { NextResponse } from "next/server";
import { executeSell } from "@/lib/portfolio";
import { processClosedTrade } from "@/lib/lessons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const reasoning = body?.reasoning ?? "Cierre manual";
    const result = await executeSell({ trade_id: params.id, reasoning });
    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }
    // Trigger de aprendizaje en background (no bloqueamos respuesta)
    processClosedTrade(params.id).catch((e) =>
      console.error("processClosedTrade error:", e)
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
