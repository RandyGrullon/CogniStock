/**
 * Memoria de largo plazo: port de backend/memory/{lessons,rag}.py
 */

import { v4 as uuidv4 } from "uuid";
import { getServerSupabase } from "./supabase/server";
import { generateLesson } from "./groq";

export async function getLessonsByTicker(
  ticker?: string,
  limit = 5
): Promise<any[]> {
  const db = getServerSupabase();
  let q = db
    .from("lecciones")
    .select("*")
    .order("fecha", { ascending: false })
    .limit(limit);
  if (ticker) q = q.eq("ticker", ticker);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getRelevantMemory(ticker: string): Promise<string> {
  const lessons = await getLessonsByTicker(ticker, 5);
  if (!lessons.length) return "No hay antecedentes específicos para este ticker en la memoria.";
  return lessons
    .map(
      (l) =>
        `[${l.fecha}] ${l.titulo ?? "Lección"}: ${l.leccion ?? ""} (Patrón: ${l.patron ?? "N/A"})`
    )
    .join("\n\n");
}

export async function processClosedTrade(tradeId: string): Promise<void> {
  const db = getServerSupabase();
  const { data: trade, error } = await db
    .from("trades")
    .select("*")
    .eq("id", tradeId)
    .single();
  if (error || !trade) return;
  if (trade.leccion_generada) return;

  try {
    const outcome = {
      pnl: trade.pnl ?? 0,
      pnl_porcentaje: trade.pnl_porcentaje ?? 0,
      contexto_mercado: `Precio salida: ${trade.precio_salida} el ${trade.fecha_salida}`,
    };
    const lesson = await generateLesson(trade, outcome);

    await db.from("lecciones").insert({
      id: uuidv4(),
      trade_id: tradeId,
      ticker: trade.ticker,
      fecha: new Date().toISOString(),
      tipo: lesson.tipo,
      titulo: lesson.titulo,
      leccion: lesson.leccion,
      tags: Array.isArray(lesson.tags) ? lesson.tags : [],
      patron: lesson.patron,
      aplicar_cuando: lesson.aplicar_cuando,
      estrellas: lesson.estrellas,
    });

    await db.from("trades").update({ leccion_generada: true }).eq("id", tradeId);
  } catch (e) {
    console.error("Error generando lección para", tradeId, e);
  }
}
