"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, ResponsiveContainer, YAxis 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, ChevronDown, ChevronUp, Newspaper, Star, Globe, Activity,
  BarChart2, Zap
} from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MarketPage() {
  const { data, isLoading, error } = useSWR('/api/market/overview', fetcher, {
    refreshInterval: 30000, 
  });
  const [expandedNews, setExpandedNews] = useState<number | null>(null);
  const [moverTab, setMoverTab] = useState<'gainers'|'losers'|'actives'>('gainers');

  // Heatmap Sectors from API
  const sectors = data?.sectors || [];
  
  // Movers from API
  const moversList = data?.movers?.[moverTab] || [];

  // Temporary predictions mockup to mimic Perplexity UI
  const predictions = [
    { question: "What will WTI Crude Oil (WTI) hit in May?", target1: "↑ $105", prob1: 78.0, chg1: 14.0, target2: "↓ $95", prob2: 75.0, chg2: -4.5, target3: "↑ $110", prob3: 63.0, chg3: 15.0 },
    { question: "MicroStrategy sells any Bitcoin by ___?", target1: "Dec 31, 2026", prob1: 90.0, chg1: -2.0, target2: "Jun 30, 2026", prob2: 76.0, chg2: 1.2, target3: "May 31, 2026", prob3: 55.0, chg3: -2.0 },
  ];

  return (
    <main className="flex-1 p-6 space-y-8 overflow-y-auto bg-[#050505] text-zinc-300">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent flex items-center gap-3">
            <Globe className="text-blue-500" size={36} />
            Market Hub
          </h1>
          <p className="text-zinc-500 font-medium italic mt-2">
            "Perspectiva global, screener y noticias en tiempo real para CogniStock"
          </p>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
          Error al cargar los datos del mercado en tiempo real.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Top Assets & Market Summary & Heatmap */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Top Assets */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity size={18} className="text-blue-500" />
                Top Assets
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-32 bg-white/5 border border-white/5 rounded-3xl animate-pulse" />
                ))
              ) : (
                data?.assets?.map((asset: any) => {
                  const isPositive = asset.changePercent >= 0;
                  const chartData = asset.chart.map((p: number, i: number) => ({ i, price: p }));
                  return (
                    <div key={asset.symbol} className="bg-zinc-900/40 border border-white/5 p-5 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                          <h3 className="font-bold text-white">{asset.name}</h3>
                          <p className="text-xl font-mono text-white mt-1">
                            {asset.price ? `$${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                          </p>
                        </div>
                        <div className={`text-right ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          <div className="flex items-center gap-1 justify-end font-bold text-sm">
                            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {Math.abs(asset.changePercent).toFixed(2)}%
                          </div>
                          <p className="text-xs font-mono mt-0.5">
                            {isPositive ? '+' : ''}{asset.change?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-40 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <YAxis domain={['auto', 'auto']} hide />
                            <Line type="monotone" dataKey="price" stroke={isPositive ? '#10b981' : '#ef4444'} strokeWidth={2} dot={false} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Market Summary (News) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Newspaper size={18} className="text-blue-500" />
                Market Summary
              </h2>
            </div>
            
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
              {isLoading ? (
                <div className="p-8 text-center text-zinc-500 animate-pulse text-sm">Cargando noticias...</div>
              ) : data?.news?.length > 0 ? (
                data.news.map((item: any, idx: number) => {
                  const isExpanded = expandedNews === idx;
                  return (
                    <div key={idx} className="transition-colors hover:bg-white/[0.02]">
                      <button onClick={() => setExpandedNews(isExpanded ? null : idx)} className="w-full p-5 flex items-center justify-between text-left">
                        <div className="flex-1 pr-4">
                          <h3 className="text-sm font-bold text-zinc-200 leading-snug">{item.title}</h3>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500 font-mono">
                            <span className="text-blue-400 font-bold">{item.publisher}</span>
                            <span>•</span>
                            <span>{new Date(item.time * 1000).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-zinc-500">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="p-5 pt-0 text-sm text-zinc-400 leading-relaxed border-t border-white/5 bg-black/20">
                              Esta noticia es clave para el sentimiento actual del mercado. La IA analiza estos eventos para anticipar volatilidad.
                              <div className="mt-4">
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">
                                  Leer artículo completo ↗
                                </a>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-zinc-500 text-sm">No hay noticias relevantes en este momento.</div>
              )}
            </div>
          </section>

          {/* S&P 500 Sector Heatmap */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-500" />
                US Sectors Heatmap
              </h2>
            </div>
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-4 min-h-[300px]">
              {isLoading ? (
                <div className="w-full h-[300px] bg-white/5 animate-pulse rounded-2xl" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 h-full">
                  {sectors.map((sec: any) => {
                    const isPos = sec.changePercent >= 0;
                    const opacity = Math.min(Math.abs(sec.changePercent) / 3, 1) * 0.8 + 0.2; // Opacity 0.2 to 1.0 based on %
                    return (
                      <Link href={`/trading?asset=${sec.symbol}`} key={sec.symbol} 
                        className="rounded-xl flex flex-col justify-between p-3 hover:scale-[1.02] transition-transform cursor-pointer"
                        style={{ backgroundColor: isPos ? `rgba(16, 185, 129, ${opacity})` : `rgba(239, 68, 68, ${opacity})` }}
                      >
                        <span className="font-bold text-white text-sm truncate">{sec.name}</span>
                        <div className="text-right">
                          <span className="font-mono text-white text-lg font-black">{isPos?'+':''}{sec.changePercent?.toFixed(2)}%</span>
                          <p className="text-[10px] text-white/70 font-mono">{sec.symbol}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right Column: Prediction Markets & Movers */}
        <div className="space-y-6">
          
          {/* Prediction Markets */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-amber-400" />
                Prediction Markets
              </h3>
            </div>
            <div className="space-y-6">
              {predictions.map((p, i) => (
                <div key={i} className="space-y-3">
                  <h4 className="font-bold text-sm text-zinc-200">{p.question}</h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                      <span className="text-zinc-400">{p.target1}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">{p.prob1.toFixed(1)}%</span>
                        <span className={p.chg1 >= 0 ? "text-emerald-400" : "text-red-400"}>{p.chg1 >= 0 ? '↗' : '↘'} {Math.abs(p.chg1)}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                      <span className="text-zinc-400">{p.target2}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">{p.prob2.toFixed(1)}%</span>
                        <span className={p.chg2 >= 0 ? "text-emerald-400" : "text-red-400"}>{p.chg2 >= 0 ? '↗' : '↘'} {Math.abs(p.chg2)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Screener Movers (Gainers / Losers / Active) */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden sticky top-6">
            <div className="flex items-center w-full border-b border-white/5">
              <button onClick={() => setMoverTab('gainers')} className={`flex-1 p-4 text-xs font-bold uppercase tracking-widest ${moverTab === 'gainers' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-white transition-colors'}`}>Gainers</button>
              <button onClick={() => setMoverTab('losers')} className={`flex-1 p-4 text-xs font-bold uppercase tracking-widest ${moverTab === 'losers' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-white transition-colors'}`}>Losers</button>
              <button onClick={() => setMoverTab('actives')} className={`flex-1 p-4 text-xs font-bold uppercase tracking-widest ${moverTab === 'actives' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-white transition-colors'}`}>Active</button>
            </div>
            
            <div className="p-2 space-y-1 min-h-[300px]">
              {isLoading ? (
                <div className="p-8 text-center text-zinc-500 text-sm animate-pulse">Cargando screeners...</div>
              ) : moversList.length > 0 ? (
                moversList.map((item: any) => {
                  const isPos = item.percent >= 0;
                  return (
                    <Link href={`/trading?asset=${item.symbol}`} key={item.symbol} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-bold text-white group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors shrink-0">
                          {item.symbol.slice(0, 3)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate max-w-[120px]">{item.name}</p>
                          <p className="text-[10px] font-mono text-zinc-500">{item.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-mono text-white">
                          ${item.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-[10px] font-bold font-mono ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPos ? '+' : ''}{item.percent?.toFixed(2)}%
                        </p>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <div className="p-8 text-center text-zinc-500 text-sm">No hay datos disponibles</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
