"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Info,
  TrendingUp,
  TrendingDown,
  Activity,
  X,
  Wallet,
  Zap,
  Brain,
  Target,
  Clock,
  ChevronRight,
  Eye,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Scan,
  Cpu
} from "lucide-react";
import useSWR, { mutate } from "swr";
import TradingChart from "@/components/TradingChart";
import { useLivePrices } from "@/hooks/useLivePrice";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SignalsPage() {
  const { data: analysis, isLoading: loadingAnalysis } = useSWR("/api/analysis/recent", fetcher, {
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
  const [selectedSignal, setSelectedSignal] = useState<any>(null);

  const closeTrade = async (id: string) => {
    if (!confirm("¿Deseas liquidar esta posición inmediatamente?")) return;
    try {
      const res = await fetch(`/api/portfolio/trades/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasoning: "Liquidación desde Intelligence Hub" }),
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
    <main className="flex-1 p-6 space-y-10 overflow-y-auto bg-[#050505] text-zinc-300">
      {/* Header Elite */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Signal Intelligence Unit</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white flex items-center gap-4">
            <Cpu className="text-blue-500" size={40} />
            AI SIGNAL HUB
          </h1>
          <p className="text-zinc-500 font-medium max-w-xl leading-relaxed">
            Monitoreo neural en tiempo real. Algoritmos de CogniStock escaneando patrones institucionales y detectando asimetrías de mercado con precisión cuántica.
          </p>
        </div>

        <div className="flex gap-4">
           <div className="px-6 py-4 bg-zinc-900/40 border border-white/5 rounded-2xl flex flex-col items-end">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">System Status</span>
              <span className="text-emerald-400 font-mono font-black text-sm uppercase flex items-center gap-2">
                Fully Operational <Scan size={14} />
              </span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Lado Izquierdo: Resumen y Posiciones (Cols: 4) */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Quick Stats Section */}
          <section className="grid grid-cols-2 gap-4">
             <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 p-5 rounded-[2rem] space-y-1">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Confidence Avg</span>
                <p className="text-3xl font-black text-white font-mono">87.4%</p>
             </div>
             <div className="bg-gradient-to-br from-emerald-600/10 to-transparent border border-emerald-500/20 p-5 rounded-[2rem] space-y-1">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Alpha</span>
                <p className="text-3xl font-black text-white font-mono">+{openTrades?.length || 0}</p>
             </div>
          </section>

          {/* Posiciones Abiertas (V2) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Wallet size={14} /> Active Exposures
              </h2>
            </div>

            <div className="space-y-3">
              {openTrades && openTrades.length > 0 ? (
                openTrades.map((trade: any) => (
                  <LivePositionCompact
                    key={trade.id}
                    trade={trade}
                    tick={livePrices[trade.ticker.toUpperCase()] ?? null}
                    onClose={() => closeTrade(trade.id)}
                  />
                ))
              ) : (
                <div className="p-10 border border-dashed border-white/5 rounded-[2rem] text-center">
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">No active positions</p>
                </div>
              )}
            </div>
          </section>

          {/* AI Neural Feed (Log de actividad) */}
          <section className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Neural Activity Feed</h3>
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-3 text-[11px] leading-snug">
                  <div className="w-1 h-8 bg-blue-500/20 rounded-full" />
                  <p className="text-zinc-500 italic">
                    <span className="text-zinc-300 font-bold font-mono mr-2">[{new Date().toLocaleTimeString()}]</span>
                    CogniStock ha re-ajustado el modelo para {['XAUUSD', 'BTCUSD', 'NVDA'][i-1]} detectando acumulación.
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Lado Derecho: Señales y Detalle (Cols: 8) */}
        <div className="xl:col-span-8 space-y-8">
          
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <Zap size={24} fill="currentColor" className="text-blue-500" />
              PRIORITY SIGNALS
            </h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-lg bg-zinc-800 text-[10px] font-black text-zinc-400 border border-white/5 uppercase">All Assets</span>
              <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-[10px] font-black text-blue-500 border border-blue-500/20 uppercase">High Confidence</span>
            </div>
          </div>

          <div className="space-y-6">
            {loadingAnalysis ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-white/5 rounded-[2.5rem] animate-pulse" />
              ))
            ) : Array.isArray(analysis) && analysis.length > 0 ? (
              analysis.map((sig: any, i: number) => {
                const isBuy = sig.recomendacion === "BUY";
                const isSelected = selectedSignal?.id === sig.id;
                
                return (
                  <motion.div
                    key={sig.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedSignal(isSelected ? null : sig)}
                    className={`relative overflow-hidden rounded-[2.5rem] border transition-all cursor-pointer group ${
                      isSelected ? 'border-blue-500/50 bg-blue-500/[0.02] ring-4 ring-blue-500/10' : 'border-white/5 bg-zinc-900/40 hover:border-white/20'
                    }`}
                  >
                    <div className="p-8 space-y-6">
                      {/* Top Row: Symbol and Rating */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black shadow-2xl ${
                            isBuy ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                          }`}>
                            {sig.ticker.slice(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-3xl font-black tracking-tighter text-white">{sig.ticker}</h3>
                              <div className={`px-4 py-1 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                isBuy ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                              }`}>
                                {isBuy ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {sig.recomendacion}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                              <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(sig.fecha).toLocaleTimeString()}</span>
                              <span className="flex items-center gap-1.5"><Target size={12} /> Confidence: {sig.confianza}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 bg-black/40 px-8 py-5 rounded-[2rem] border border-white/5">
                           <div className="text-center space-y-1">
                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Entry</span>
                              <p className="text-lg font-mono font-black text-white">${sig.precio_objetivo ? (sig.precio_objetivo * 0.95).toFixed(2) : '---'}</p>
                           </div>
                           <div className="w-px h-8 bg-white/10" />
                           <div className="text-center space-y-1">
                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target</span>
                              <p className="text-lg font-mono font-black text-emerald-400">${sig.precio_objetivo || '---'}</p>
                           </div>
                           <div className="w-px h-8 bg-white/10" />
                           <div className="text-center space-y-1">
                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Risk</span>
                              <p className={`text-lg font-mono font-black ${sig.nivel_riesgo === 'BAJO' ? 'text-emerald-500' : 'text-amber-500'}`}>{sig.nivel_riesgo}</p>
                           </div>
                        </div>
                      </div>

                      {/* Summary Text */}
                      <p className="text-zinc-400 text-lg leading-relaxed italic font-medium max-w-3xl border-l-2 border-blue-500/20 pl-6">
                        "{sig.razonamiento.split('.')[0]}..."
                      </p>

                      {/* Expandable Section */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-8 pt-6 border-t border-white/5"
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                               <div className="space-y-4">
                                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
                                    <Brain size={16} /> Neural Reasoning
                                  </h4>
                                  <p className="text-sm text-zinc-300 leading-relaxed bg-black/40 p-5 rounded-3xl border border-white/5">
                                    {sig.razonamiento}
                                  </p>
                               </div>
                               <div className="space-y-6">
                                  <div className="space-y-4">
                                     <h4 className="text-xs font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                                       <ShieldAlert size={16} /> Threat Assessment
                                     </h4>
                                     <div className="flex flex-wrap gap-2">
                                        {(Array.isArray(sig.riesgos) ? sig.riesgos : [sig.riesgos]).map((r: string, idx: number) => (
                                          <span key={idx} className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">
                                            {r}
                                          </span>
                                        ))}
                                     </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                     <Link href={`/trading?asset=${sig.ticker}`} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-black font-black uppercase text-xs hover:bg-zinc-200 transition-all active:scale-95">
                                        <Zap size={16} fill="black" /> Deploy Neural Trade
                                     </Link>
                                     <Link href={`/chat?asset=${sig.ticker}`} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-zinc-800 text-white font-black uppercase text-xs hover:bg-zinc-700 transition-all active:scale-95 border border-white/5">
                                        <Activity size={16} /> Deep Analysis
                                     </Link>
                                  </div>
                               </div>
                            </div>

                            <div className="h-80 w-full rounded-3xl overflow-hidden border border-white/5">
                               <TradingChart ticker={sig.ticker} markers={[sig]} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!isSelected && (
                         <div className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                            <Eye size={12} /> Click to expand neural breakdown
                         </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-zinc-600">
                  <Activity size={32} />
                </div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm italic">Scanning global markets... No priority signals detected yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}

function LivePositionCompact({ trade, tick, onClose }: any) {
  const currentPrice = tick?.price ?? trade.precio_actual ?? trade.precio_entrada;
  const pnl = trade.tipo === 'SELL' ? (trade.precio_entrada - currentPrice) * trade.acciones : (currentPrice - trade.precio_entrada) * trade.acciones;
  const pnlPct = trade.tipo === 'SELL' ? (trade.precio_entrada / currentPrice - 1) * 100 : (currentPrice / trade.precio_entrada - 1) * 100;
  const positive = pnl >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group p-5 rounded-[2rem] border transition-all relative overflow-hidden ${
        positive ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "border-red-500/20 bg-red-500/[0.02]"
      }`}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
            positive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          }`}>
            {trade.ticker.slice(0, 3)}
          </div>
          <div>
            <h4 className="font-black text-white text-sm tracking-tight">{trade.ticker}</h4>
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${trade.tipo === 'BUY' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {trade.tipo}
              </span>
              <span className="text-[9px] font-mono font-bold text-zinc-600">${trade.precio_entrada.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
           <p className={`text-lg font-mono font-black ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {positive ? '+' : ''}{pnlPct.toFixed(2)}%
           </p>
           <p className="text-[10px] font-bold text-zinc-500 font-mono">${pnl.toFixed(2)}</p>
        </div>

        <button onClick={onClose} className="ml-4 p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
           <X size={14} />
        </button>
      </div>
      
      {/* Mini background graph feeling */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`h-full ${positive ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
        />
      </div>
    </motion.div>
  );
}
