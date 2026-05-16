/**
 * Motor de análisis: port de backend/core/analyzer.py.
 *
 * - Trae snapshot de mercado (precio + fundamentales) + histórico + indicadores
 * - Recupera lecciones relevantes (RAG)
 * - Llama a Groq con prompt estructurado
 * - Inserta el resultado en `analisis`
 */

import { v4 as uuidv4 } from "uuid";
import { getServerSupabase } from "./supabase/server";
import {
  getTickerData,
  getPriceHistory,
  calculateIndicators,
  interpretIndicators,
  getTickerNews,
} from "./marketData";
import { analyzeStock, AnalysisResult } from "./groq";
import { getRelevantMemory } from "./lessons";

export type FullAnalysis = AnalysisResult & {
  id: string;
  ticker: string;
  fecha: string;
  precio_actual: number;
  datos_tecnicos: any;
  datos_fundamentales: any;
};

export async function analyzeTicker(ticker: string, imageBase64?: string): Promise<FullAnalysis> {
  const fundamentals = await getTickerData(ticker);
  const history = await getPriceHistory(ticker, "3mo", "1d");
  const indicators = calculateIndicators(history);
  const interpretation = interpretIndicators(indicators);
  const memory = await getRelevantMemory(ticker);
  const news = await getTickerNews(ticker);

  const result = await analyzeStock({
    ticker,
    technical: { ...indicators, ...interpretation },
    fundamentals,
    news,
    memory,
    image: imageBase64,
  });

  const full: FullAnalysis = {
    id: uuidv4(),
    ticker,
    fecha: new Date().toISOString(),
    precio_actual: fundamentals.price,
    datos_tecnicos: { ...indicators, ...interpretation },
    datos_fundamentales: fundamentals,
    ...result,
  };

  const db = getServerSupabase();
  await db.from("analisis").insert({
    id: full.id,
    ticker: full.ticker,
    fecha: full.fecha,
    recomendacion: full.recomendacion,
    confianza: full.confianza,
    nivel_riesgo: full.nivel_riesgo,
    razonamiento: full.razonamiento,
    riesgos: Array.isArray(full.riesgos) ? full.riesgos : [String(full.riesgos)],
    precio_objetivo: full.precio_objetivo,
    stop_loss: full.stop_loss,
    horizonte: full.horizonte,
    datos_tecnicos: full.datos_tecnicos,
    datos_fundamentales: full.datos_fundamentales,
  });
  return full;
}
