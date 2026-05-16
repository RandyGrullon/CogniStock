"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Info,
  TrendingUp,
  TrendingDown,
  Activity,
  X,
  Wallet,
} from "lucide-react";
import useSWR, { mutate } from "swr";
import TradingChart from "@/components/TradingChart";
import { useLivePrices } from "@/hooks/useLivePrice";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SignalsPage() {
  const { data: analysis } = useSWR("/api/analysis/recent", fetcher, {
    refreshInterval: 10000,
  });
  const { data: openTrades } = useSWR("/api/portfolio/trades?estado=OPEN", fetcher, {
    refreshInterval: 10000,
  });
  const { data: allTrades } = useSWR("/api/portfolio/trades", fetcher, {
    refreshInterval: 10000,
  });

  const openTickers = useMemo(() => {
    const arr = Array.isArray(openTrades) ? openTrades : [];
    return Array.from(new Set(arr.map((t: any) => t.ticker)));
  }, [openTrades]);
  const livePrices = useLivePrices(openTickers);

  const closeTrade = async (id: string) => {
    if (!confirm("¿Cerrar esta posición al precio actual?")) return;
    try {
      const res = await fetch(`/api/portfolio/trades/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasoning: "Cierre rápido desde Señales" }),
      });
      if (res.ok) {
        mutate("/api/portfolio/trades");
        mutate("/api/portfolio/trades?estado=OPEN");
        mutate("/api/portfolio/status");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Señales AI Reales
          </h1>
          <p className="text-zinc-500 font-medium">
            Posiciones abiertas con P&L en vivo y análisis predictivo basado en datos de mercado actuales.
          </p>
        </div>
      </header>

      {/* Posiciones abiertas con P&L vivo */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center space-x-2 text-zinc-300">
          <Wallet className="text-emerald-500" size={20} />
          <span>Posiciones Abiertas</span>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
            {openTickers.length} activas
          </span>
        </h2>

        {openTrades && openTrades.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {openTrades.map((trade: any) => (
              <LivePositionCard
                key={trade.id}
                trade={trade}
                tick={livePrices[trade.ticker.toUpperCase()] ?? null}
                onClose={() => closeTrade(trade.id)}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-3xl border border-white/5 text-center">
            <p className="text-zinc-500 font-mono text-xs">Sin posiciones abiertas en este momento.</p>
          </div>
        )}
      </section>

      {/* Análisis (lo que ya estaba) */}
      <div className="grid grid-cols-1 gap-6 pt-8 border-t border-white/5">
        <h2 className="text-xl font-bold flex items-center space-x-2 text-zinc-300">
          <Activity className="text-blue-500" size={20} />
          <span>Análisis Recientes de la IA</span>
        </h2>
        {Array.isArray(analysis) && analysis.length > 0 ? (
          analysis.map((sig: any, i: number) => {
            const relevantTrades = (allTrades ?? []).filter(
              (t: any) => t.ticker === sig.ticker
            );
            return (
              <motion.div
                key={sig.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-8 rounded-3xl border border-white/5 space-y-8 hover:border-blue-500/20 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center space-x-6">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${
                        sig.recomendacion === "BUY"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {sig.ticker}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h2 className="text-2xl font-bold tracking-tight">{sig.ticker}</h2>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            sig.recomendacion === "BUY"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
                          {sig.recomendacion}
                        </span>
                      </div>
                      <p className="text-zinc-500 font-mono text-xs">
                        {new Date(sig.fecha).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-8 px-4 sm:px-8 py-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-center min-w-[120px]">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter mb-1">
                        Confianza
                      </p>
                      <p className="text-xl font-mono font-black text-blue-500">{sig.confianza}%</p>
                    </div>
                    <div className="hidden sm:block w-[1px] h-8 bg-white/10" />
                    <div className="text-center min-w-[120px]">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter mb-1">
                        Riesgo
                      </p>
                      <p
                        className={`text-xl font-mono font-black ${
                          sig.nivel_riesgo === "BAJO" ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {sig.nivel_riesgo}
                      </p>
                    </div>
                  </div>
                </div>

                <TradingChart ticker={sig.ticker} markers={[sig, ...relevantTrades]} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-white/5">
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold flex items-center space-x-2 text-zinc-400">
                      <Info size={16} />
                      <span>Razonamiento Estratégico AI</span>
                    </h3>
                    <p className="text-zinc-300 leading-relaxed text-sm">{sig.razonamiento}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold flex items-center space-x-2 text-zinc-400">
                        <ShieldAlert size={16} className="text-red-500" />
                        <span>Riesgos</span>
                      </h3>
                      <div className="text-xs text-zinc-500 leading-relaxed">
                        {Array.isArray(sig.riesgos) ? sig.riesgos.join(", ") : sig.riesgos}
                      </div>
                    </div>

                    <div className="pt-4 space-y-3 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Precio Objetivo</span>
                        <span className="font-mono font-bold text-emerald-500">${sig.precio_objetivo ?? "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Stop Loss</span>
                        <span className="font-mono font-bold text-red-500">${sig.stop_loss ?? "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <p className="text-zinc-600 italic text-center py-20">Aún no se han generado señales reales.</p>
        )}
      </div>
    </div>
  );
}

function LivePositionCard({
  trade,
  tick,
  onClose,
}: {
  trade: any;
  tick: { price: number } | null;
  onClose: () => void;
}) {
  const currentPrice = tick?.price ?? trade.precio_actual ?? trade.precio_entrada;
  const pnl = (currentPrice - trade.precio_entrada) * trade.acciones;
  const pnlPct = (currentPrice / trade.precio_entrada - 1) * 100;
  const positive = pnl >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 rounded-3xl border space-y-4 relative ${
        positive ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-red-500/20 bg-red-500/[0.03]"
      }`}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
        title="Cerrar posición"
      >
        <X size={14} />
      </button>
      <div className="flex items-center justify-between">
        <div className="font-bold font-mono text-white text-lg">{trade.ticker}</div>
        <div
          className={`text-[10px] font-mono font-bold tracking-widest ${
            tick ? "text-emerald-400" : "text-zinc-500"
          }`}
        >
          {tick ? "LIVE" : "DEFERRED"}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-zinc-500 uppercase font-bold tracking-widest text-[10px]">Entrada</p>
          <p className="font-mono text-white font-bold">${trade.precio_entrada?.toFixed?.(2) ?? trade.precio_entrada}</p>
        </div>
        <div>
          <p className="text-zinc-500 uppercase font-bold tracking-widest text-[10px]">Actual</p>
          <p className="font-mono text-white font-bold">${currentPrice?.toFixed?.(2)}</p>
        </div>
        <div>
          <p className="text-zinc-500 uppercase font-bold tracking-widest text-[10px]">Cantidad</p>
          <p className="font-mono text-white font-bold">{trade.acciones}</p>
        </div>
        <div>
          <p className="text-zinc-500 uppercase font-bold tracking-widest text-[10px]">Desde</p>
          <p className="font-mono text-zinc-400 text-[10px]">
            {new Date(trade.fecha_entrada).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div
        className={`flex items-center justify-between pt-4 border-t ${
          positive ? "border-emerald-500/20" : "border-red-500/20"
        }`}
      >
        <div className="flex items-center gap-2">
          {positive ? (
            <TrendingUp size={14} className="text-emerald-400" />
          ) : (
            <TrendingDown size={14} className="text-red-400" />
          )}
          <span
            className={`font-mono font-black tracking-tighter ${
              positive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {positive ? "+" : ""}${pnl.toFixed(2)}
          </span>
        </div>
        <span
          className={`text-xs font-mono font-bold ${
            positive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {positive ? "+" : ""}
          {pnlPct.toFixed(2)}%
        </span>
      </div>
    </motion.div>
  );
}
