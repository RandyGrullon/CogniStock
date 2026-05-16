import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getServerSupabase } from "@/lib/supabase/server";
import { analyzeTicker } from "@/lib/analyzer";
import { executeTrade } from "@/lib/portfolio";
import { getTickerData } from "@/lib/marketData";
import { getRelevantMemory } from "@/lib/lessons";
import {
  generatePreActionPlan,
  generatePostActionReflection,
} from "@/lib/groq";
import { assertCronAuthorized, withCronRun } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getTickers(): string[] {
  const raw = process.env.TICKERS_MONITOREADOS ?? "XAUUSD,TSLA,NVDA,AAPL,MSFT,META,AMZN,AMD,GOOGL";
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function getConfidenceThreshold(): number {
  return Number(process.env.CONFIANZA_MINIMA_PARA_TRADE ?? 70);
}

async function processTicker(ticker: string, db: ReturnType<typeof getServerSupabase>) {
  // 1. PRE-action: lo que la IA planea hacer minutos antes
  const snapshot = await getTickerData(ticker);
  const memory = await getRelevantMemory(ticker);
  const planned = await generatePreActionPlan({
    ticker,
    market_snapshot: snapshot,
    memory,
  }).catch((e) => ({
    planned_action: "WATCH",
    rationale: `Fallback: error generando plan: ${e?.message ?? e}`,
    expected_outcome: "",
    confidence: 0,
  }));

  const preId = uuidv4();
  await db.from("pre_action_logs").insert({
    id: preId,
    scheduled_at: new Date().toISOString(),
    ticker,
    planned_action: planned.planned_action,
    rationale: planned.rationale,
    market_snapshot: snapshot,
    confidence: planned.confidence,
    expected_outcome: planned.expected_outcome,
  });

  // 2. Análisis real
  let analysis: any;
  try {
    analysis = await analyzeTicker(ticker);
  } catch (e: any) {
    await db.from("post_action_logs").insert({
      pre_action_id: preId,
      ticker,
      executed_action: "ERROR",
      result: `Falló el análisis: ${e?.message ?? e}`,
      lessons: "",
    });
    return { ticker, status: "analysis_error", error: e?.message ?? String(e) };
  }

  // 3. Decisión de operar
  let executed: any = { action: "NO-OP", reason: "Confianza/recomendación insuficiente" };
  const threshold = getConfidenceThreshold();
  
  // Buscar si ya tenemos una posición abierta para este ticker
  const openTrades = await db.from("trades").select("*").eq("ticker", ticker).eq("estado", "OPEN");
  const currentPosition = openTrades.data?.[0];

  if (analysis.recomendacion === "BUY" && analysis.confianza >= threshold) {
    if (currentPosition) {
      executed = { action: "HOLD", reason: "Ya hay una posición abierta" };
    } else {
      const trade = await executeTrade({
        ticker,
        side: "BUY",
        amount: 1, // Podríamos hacerlo dinámico después
        reasoning: `[AUTO ${analysis.confianza}%] ${analysis.razonamiento?.slice(0, 200) ?? ""}`,
        analysis: analysis,
      });
      executed = "error" in trade ? { action: "BUY_FAILED", reason: trade.error } : { action: "BUY", trade_id: trade.id };
    }
  } else if (analysis.recomendacion === "SELL" && analysis.confianza >= threshold) {
    if (currentPosition) {
      const { executeSell } = await import("@/lib/portfolio");
      const result = await executeSell({
        trade_id: currentPosition.id,
        reasoning: `[AUTO SELL ${analysis.confianza}%] ${analysis.razonamiento?.slice(0, 200) ?? ""}`
      });
      executed = "error" in result ? { action: "SELL_FAILED", reason: result.error } : { action: "SELL", trade_id: currentPosition.id };
    } else {
      executed = { action: "NO-OP", reason: "Recomendación SELL pero no hay posición abierta" };
    }
  }

  // 4. POST-action: reflexión
  const reflection = await generatePostActionReflection({
    ticker,
    planned,
    executed: { ...executed, analysis_recommendation: analysis.recomendacion, confianza: analysis.confianza },
  }).catch((e) => ({ result: "(sin reflexión)", lessons: `Error: ${e?.message ?? e}` }));

  await db.from("post_action_logs").insert({
    pre_action_id: preId,
    ticker,
    executed_action: executed.action,
    result: reflection.result,
    lessons: reflection.lessons,
    pnl: null,
  });

  return { ticker, status: "ok", action: executed.action, confidence: analysis.confianza };
}

export async function GET(req: Request) {
  try {
    assertCronAuthorized(req);
  } catch (resp: any) {
    return resp instanceof Response ? resp : NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await withCronRun("run-analysis", { tickers: getTickers() }, async () => {
    const db = getServerSupabase();
    const tickers = getTickers();
    const out: any[] = [];
    for (const t of tickers) {
      try {
        out.push(await processTicker(t, db));
      } catch (e: any) {
        out.push({ ticker: t, status: "fatal", error: e?.message ?? String(e) });
      }
    }
    return out;
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
