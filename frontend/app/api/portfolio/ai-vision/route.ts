import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { analyzeTicker } from "@/lib/analyzer";
import { executeTrade, executeSell } from "@/lib/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticker, image } = body;
    if (!ticker) return NextResponse.json({ error: "Ticker requerido" }, { status: 400 });

    // 1. Análisis relámpago
    console.log(`[AI-VISION] Iniciando análisis para ${ticker} (Con imagen: ${!!image})`);
    const analysis = await analyzeTicker(ticker, image);
    console.log(`[AI-VISION] Análisis completado. Recomendación: ${analysis.recomendacion}`);
    
    // 2. Ejecución inmediata si hay señal clara (> 60% confianza para este modo rápido)
    let actionResult = null;
    const db = getServerSupabase();
    
    // Buscar posición actual de forma segura
    const { data: positions } = await db
      .from("trades")
      .select("*")
      .eq("ticker", ticker)
      .eq("estado", "OPEN")
      .limit(1);

    const existing = positions?.[0];

    if (!existing) {
      if (analysis.recomendacion === "BUY" && analysis.confianza >= 60) {
        actionResult = await executeTrade({
          ticker,
          side: "BUY",
          amount: 1,
          reasoning: `[FAST-VISION] ${analysis.razonamiento}`,
          analysis: analysis
        });
      } else if (analysis.recomendacion === "SELL" && analysis.confianza >= 60) {
        actionResult = await executeTrade({
          ticker,
          side: "SELL",
          amount: 1,
          reasoning: `[FAST-VISION] ${analysis.razonamiento}`,
          analysis: analysis
        });
      }
    } else {
      // If we have an existing position and the AI recommends the opposite (e.g., BUY position and AI says SELL, or SELL position and AI says BUY)
      if ((existing.tipo === "BUY" && analysis.recomendacion === "SELL" && analysis.confianza >= 60) ||
          (existing.tipo === "SELL" && analysis.recomendacion === "BUY" && analysis.confianza >= 60)) {
        actionResult = await executeSell({
          trade_id: existing.id,
          reasoning: `[FAST-VISION] Cambio de tendencia detectado: ${analysis.razonamiento}`
        });
      }
    }

    return NextResponse.json({
      thought: analysis.razonamiento,
      confidence: analysis.confianza,
      recommendation: analysis.recomendacion,
      action: actionResult ? (analysis.recomendacion) : "WATCHING",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("AI-VISION FATAL:", error);
    return NextResponse.json({ 
      error: error.message,
      detail: "Error interno en el motor de visión neural. Revisa los logs de Vercel."
    }, { status: 500 });
  }
}
