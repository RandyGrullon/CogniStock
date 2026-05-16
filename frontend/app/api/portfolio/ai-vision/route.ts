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
    
    // Determinar si es horario de mercado (NY 9:30 AM - 4:00 PM) para acciones comunes
    const isCrypto = ticker.includes("USD") || ticker.includes("BTC") || ticker.includes("ETH");
    let marketOpen = true;
    if (!isCrypto) {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "numeric", hour12: false, weekday: "long" }).format(now);
      const [weekday, time] = timeStr.split(" ");
      const [hour, minute] = time.split(":").map(Number);
      const totalMinutes = hour * 60 + minute;
      const isWeekend = weekday === "Saturday" || weekday === "Sunday";
      if (isWeekend || totalMinutes < 570 || totalMinutes >= 960) {
        marketOpen = false;
      }
    }

    if (!existing) {
      if (analysis.recomendacion === "BUY" && analysis.confianza >= 70) {
        if (!marketOpen) {
          actionResult = { status: "MARKET_CLOSED", reason: "Mercado cerrado. Esperando apertura para comprar." };
        } else {
          actionResult = await executeTrade({
            ticker,
            side: "BUY",
            amount: 1,
            reasoning: `[FAST-VISION] ${analysis.razonamiento}`,
            analysis: analysis
          });
        }
      } else if (analysis.recomendacion === "SELL" && analysis.confianza >= 70) {
        if (!marketOpen) {
          actionResult = { status: "MARKET_CLOSED", reason: "Mercado cerrado. Esperando apertura para vender en corto." };
        } else {
          actionResult = await executeTrade({
            ticker,
            side: "SELL",
            amount: 1,
            reasoning: `[FAST-VISION] ${analysis.razonamiento}`,
            analysis: analysis
          });
        }
      }
    } else {
      // If we have an existing position and the AI recommends the opposite
      if ((existing.tipo === "BUY" && analysis.recomendacion === "SELL" && analysis.confianza >= 70) ||
          (existing.tipo === "SELL" && analysis.recomendacion === "BUY" && analysis.confianza >= 70)) {
        if (!marketOpen) {
          actionResult = { status: "MARKET_CLOSED", reason: "Mercado cerrado. Esperando apertura para cerrar posición." };
        } else {
          actionResult = await executeSell({
            trade_id: existing.id,
            reasoning: `[FAST-VISION] Cambio de tendencia detectado: ${analysis.razonamiento}`
          });
        }
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
