import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { analyzeTicker } from "@/lib/analyzer";
import { executeTrade, executeSell } from "@/lib/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { ticker } = await req.json();
    if (!ticker) return NextResponse.json({ error: "Ticker requerido" }, { status: 400 });

    // 1. Análisis relámpago
    const analysis = await analyzeTicker(ticker);
    
    // 2. Ejecución inmediata si hay señal clara (> 60% confianza para este modo rápido)
    let actionResult = null;
    const db = getServerSupabase();
    
    // Buscar posición actual
    const { data: existing } = await db
      .from("trades")
      .select("*")
      .eq("ticker", ticker)
      .eq("estado", "OPEN")
      .single();

    if (analysis.recomendacion === "BUY" && analysis.confianza >= 60 && !existing) {
      actionResult = await executeTrade({
        ticker,
        side: "BUY",
        amount: 1,
        reasoning: `[FAST-VISION] ${analysis.razonamiento}`,
        analysis: analysis
      });
    } else if (analysis.recomendacion === "SELL" && analysis.confianza >= 60 && existing) {
      actionResult = await executeSell({
        trade_id: existing.id,
        reasoning: `[FAST-VISION] ${analysis.razonamiento}`
      });
    }

    return NextResponse.json({
      thought: analysis.razonamiento,
      confidence: analysis.confianza,
      recommendation: analysis.recomendacion,
      action: actionResult ? (analysis.recomendacion) : "WATCHING",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
