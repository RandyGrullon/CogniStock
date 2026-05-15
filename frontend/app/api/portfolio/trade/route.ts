import { NextResponse } from "next/server";
import { executeTrade } from "@/lib/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticker, side, amount, reasoning } = body;
    if (!ticker || !side || !amount) {
      return NextResponse.json({ error: "ticker, side y amount son requeridos" }, { status: 400 });
    }
    if (side !== "BUY") {
      return NextResponse.json(
        { error: "Solo BUY soportado por aquí. Usa /api/portfolio/trades/[id]/close para cerrar." },
        { status: 400 }
      );
    }
    const result = await executeTrade({
      ticker: String(ticker).toUpperCase(),
      side: "BUY",
      amount: Number(amount),
      reasoning: String(reasoning ?? "Sin razonamiento"),
    });
    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
