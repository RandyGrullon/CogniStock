"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, ResponsiveContainer, YAxis 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, ChevronDown, ChevronUp, Newspaper, Star, Globe, Activity
} from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MarketPage() {
  const { data, isLoading, error } = useSWR('/api/market/overview', fetcher, {
    refreshInterval: 30000, // Refresh every 30s
  });
  const [expandedNews, setExpandedNews] = useState<number | null>(null);

  // Fallback para Watchlist temporal (en una versión real esto vendría de DB)
  const watchlist = [
    { symbol: "XAUUSD", name: "Gold", price: 2345.50, change: 12.5, percent: 0.54 },
    { symbol: "BTCUSD", name: "Bitcoin", price: 64230.00, change: -1250, percent: -1.91 },
    { symbol: "AAPL", name: "Apple", price: 178.25, change: 2.15, percent: 1.22 },
    { symbol: "NVDA", name: "NVIDIA", price: 890.10, change: 15.40, percent: 1.76 },
    { symbol: "TSLA", name: "Tesla", price: 175.22, change: -4.30, percent: -2.39 },
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
            "Perspectiva global y noticias en tiempo real para el Cerebro Autónomo"
          </p>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
          Error al cargar los datos del mercado.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Top Assets & News */}
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
                            <Line 
                              type="monotone" 
                              dataKey="price" 
                              stroke={isPositive ? '#10b981' : '#ef4444'} 
                              strokeWidth={2} 
                              dot={false}
                              isAnimationActive={false}
                            />
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
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Real-time Feed</span>
            </div>
            
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
              {isLoading ? (
                <div className="p-8 text-center text-zinc-500 animate-pulse text-sm">Cargando noticias...</div>
              ) : data?.news?.length > 0 ? (
                data.news.map((item: any, idx: number) => {
                  const isExpanded = expandedNews === idx;
                  return (
                    <div key={idx} className="transition-colors hover:bg-white/[0.02]">
                      <button 
                        onClick={() => setExpandedNews(isExpanded ? null : idx)}
                        className="w-full p-5 flex items-center justify-between text-left"
                      >
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
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
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
        </div>

        {/* Right Column: Watchlist / Trending */}
        <div className="space-y-6">
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Star size={18} className="text-amber-400" />
                Watchlist
              </h3>
            </div>

            <div className="space-y-4">
              {watchlist.map((item) => {
                const isPos = item.percent >= 0;
                return (
                  <Link href={`/trading?asset=${item.symbol}`} key={item.symbol} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-white group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                        {item.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{item.name}</p>
                        <p className="text-[10px] font-mono text-zinc-500">{item.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-white">
                        ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-[10px] font-bold font-mono ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPos ? '+' : ''}{item.percent}%
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5">
              <Link href="/trading" className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all flex justify-center items-center gap-2">
                Ir a Trading Terminal
              </Link>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
