/**
 * Gestor de portafolio: port de backend/core/portfolio.py.
 *
 * Toda la lógica corre contra Supabase (no SQLite). Pensado para invocarse
 * desde Next API Routes (server-side).
 */

import { v4 as uuidv4 } from "uuid";
import { getServerSupabase } from "./supabase/server";
import { getTickerData } from "./marketData";

export type Trade = {
  id: string;
  ticker: string;
  tipo: "BUY" | "SELL";
  acciones: number;
  precio_entrada: number;
  precio_actual?: number | null;
  precio_salida?: number | null;
  fecha_entrada: string;
  fecha_salida?: string | null;
  razonamiento?: string | null;
  estado: "OPEN" | "CLOSED";
  pnl?: number;
  pnl_porcentaje?: number;
  leccion_generada?: boolean;
};

export type PortfolioStatus = {
  id: number;
  capital_inicial: number;
  capital_disponible: number;
  valor_posiciones: number;
  capital_total: number;
  total_trades: number;
  trades_ganadores: number;
  trades_perdedores: number;
  mejor_trade_pnl?: number;
  peor_trade_pnl?: number;
  ultima_actualizacion?: string;
};

export async function getPortfolioStatus(): Promise<PortfolioStatus> {
  const db = getServerSupabase();
  const { data, error } = await db.from("portafolio").select("*").eq("id", 1).single();
  if (error) {
    // Si no existe, inicializar
    if (error.code === "PGRST116" || /no rows/i.test(error.message)) {
      const initial: PortfolioStatus = {
        id: 1,
        capital_inicial: 100000,
        capital_disponible: 100000,
        valor_posiciones: 0,
        capital_total: 100000,
        total_trades: 0,
        trades_ganadores: 0,
        trades_perdedores: 0,
        ultima_actualizacion: new Date().toISOString(),
      };
      await db.from("portafolio").upsert(initial);
      return initial;
    }
    throw error;
  }
  return data as PortfolioStatus;
}

async function patchPortfolio(patch: Partial<PortfolioStatus>): Promise<void> {
  const db = getServerSupabase();
  const { error } = await db
    .from("portafolio")
    .update({ ...patch, ultima_actualizacion: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw error;
}

export async function getTrades(filter?: {
  estado?: "OPEN" | "CLOSED";
  ticker?: string;
}): Promise<Trade[]> {
  const db = getServerSupabase();
  let q = db.from("trades").select("*").order("fecha_entrada", { ascending: false });
  if (filter?.estado) q = q.eq("estado", filter.estado);
  if (filter?.ticker) q = q.eq("ticker", filter.ticker);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Trade[];
}

export async function executeTrade(args: {
  ticker: string;
  side: "BUY";
  amount: number;
  reasoning: string;
  analysis?: any;
}): Promise<Trade | { error: string }> {
  const db = getServerSupabase();
  const { ticker, amount, reasoning, analysis } = args;
  const data = await getTickerData(ticker);
  const price = data.price;
  if (!price || price <= 0) return { error: `No se pudo obtener precio para ${ticker}` };

  const status = await getPortfolioStatus();
  const cost = price * amount;
  if (status.capital_disponible < cost) {
    return { error: "Capital insuficiente" };
  }

  await patchPortfolio({ capital_disponible: status.capital_disponible - cost });

  const trade: Trade = {
    id: uuidv4(),
    ticker,
    tipo: "BUY",
    acciones: amount,
    precio_entrada: price,
    precio_actual: price,
    fecha_entrada: new Date().toISOString(),
    razonamiento: reasoning,
    estado: "OPEN",
    pnl: 0,
    pnl_porcentaje: 0,
  };

  // Guardamos el análisis dentro del trade si existe
  const payload: any = { ...trade };
  if (analysis) {
    payload.analisis_tecnico = analysis;
  }

  await db.from("trades").insert(payload);

  return trade;
}

export async function executeSell(args: {
  trade_id: string;
  reasoning: string;
}): Promise<{ id: string; pnl: number; pnl_pct: number } | { error: string }> {
  const db = getServerSupabase();
  const { data: tradeRow, error: terr } = await db
    .from("trades")
    .select("*")
    .eq("id", args.trade_id)
    .single();
  if (terr || !tradeRow) return { error: "Trade no encontrado" };
  const trade = tradeRow as Trade;
  if (trade.estado === "CLOSED") return { error: "Trade ya está cerrado" };

  const data = await getTickerData(trade.ticker);
  const price = data.price;
  const pnl = (price - trade.precio_entrada) * trade.acciones;
  const pnl_pct = (price / trade.precio_entrada - 1) * 100;

  await db
    .from("trades")
    .update({
      precio_salida: price,
      fecha_salida: new Date().toISOString(),
      estado: "CLOSED",
      pnl,
      pnl_porcentaje: pnl_pct,
    })
    .eq("id", trade.id);

  const status = await getPortfolioStatus();
  await patchPortfolio({
    capital_disponible: status.capital_disponible + price * trade.acciones,
    total_trades: (status.total_trades || 0) + 1,
    trades_ganadores: (status.trades_ganadores || 0) + (pnl > 0 ? 1 : 0),
    trades_perdedores: (status.trades_perdedores || 0) + (pnl <= 0 ? 1 : 0),
    mejor_trade_pnl: Math.max(status.mejor_trade_pnl ?? 0, pnl),
    peor_trade_pnl: Math.min(status.peor_trade_pnl ?? 0, pnl),
  });

  return { id: trade.id, pnl, pnl_pct };
}

export async function updateOpenTradesPnl(): Promise<{ updated: number }> {
  const open = await getTrades({ estado: "OPEN" });
  let total = 0;
  let updated = 0;
  const db = getServerSupabase();
  for (const t of open) {
    try {
      const md = await getTickerData(t.ticker);
      const cur = md.price;
      const pnl = (cur - t.precio_entrada) * t.acciones;
      const pnl_pct = (cur / t.precio_entrada - 1) * 100;
      await db
        .from("trades")
        .update({ precio_actual: cur, pnl, pnl_porcentaje: pnl_pct })
        .eq("id", t.id);
      total += cur * t.acciones;
      updated += 1;
    } catch {
      // skip ticker que falle
    }
  }
  const status = await getPortfolioStatus();
  await patchPortfolio({
    valor_posiciones: total,
    capital_total: (status.capital_disponible ?? 0) + total,
  });
  return { updated };
}
