"use client";

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, ResponsiveContainer, YAxis 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, ChevronDown, ChevronUp, Newspaper, Star, Globe, Activity,
  BarChart2, Zap, LayoutGrid, List, Search, Filter, ArrowUpRight, ArrowDownRight,
  ShieldCheck, Cpu, Scan, Info
} from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MarketPage() {
  const { data, isLoading, error } = useSWR('/api/market/overview', fetcher, {
    refreshInterval: 30000, 
  });
  const [expandedNews, setExpandedNews] = useState<number | null>(null);
  const [moverTab, setMoverTab] = useState<'gainers'|'losers'|'actives'>('gainers');
  const [searchQuery, setSearchQuery] = useState('');

  // Tickers macro clave para el Ticker Tape
  const macroTickers = ["^GSPC", "^IXIC", "GC=F", "CL=F", "BTC-USD", "EURUSD=X"];

  const sectors = data?.sectors || [];
  const moversList = data?.movers?.[moverTab] || [];

  return (
    <main className="flex-1 p-6 space-y-8 overflow-y-auto bg-[#050505] text-zinc-300">
      
      {/* Institutional Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Market Intelligence Unit</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white flex items-center gap-3 md:gap-4 uppercase italic leading-none">
            Market Pulse
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm font-medium max-w-xl leading-relaxed">
            Sincronización global en tiempo real. Análisis de sentimiento neural y monitoreo institucional de flujos de capital.
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="px-4 md:px-6 py-3 md:py-4 bg-zinc-900/40 border border-white/5 rounded-2xl flex flex-col items-end shadow-xl">
              <span className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase">System Status</span>
              <span className="text-emerald-400 font-mono font-black text-xs md:text-sm uppercase flex items-center gap-2">
                Operational <Scan size={14} className="hidden xs:block" />
              </span>
           </div>
        </div>
      </header>

      {/* Global Market Ticker Tape */}
      <div className="bg-[#0a0a0a] border-y border-white/5 py-2 md:py-3 overflow-hidden">
        <div className="flex items-center gap-8 md:gap-12 whitespace-nowrap animate-marquee">
           <div className="flex items-center gap-8 md:gap-12">
              {data?.assets?.slice(0, 8).map((m: any) => (
                <div key={m.symbol} className="flex items-center gap-2 md:gap-3">
                   <span className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-tighter">{m.symbol}</span>
                   <span className="text-xs md:text-sm font-mono font-black text-white">${m.price?.toLocaleString()}</span>
                   <span className={`text-[8px] md:text-[10px] font-bold ${m.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {m.changePercent >= 0 ? '↑' : '↓'} {Math.abs(m.changePercent).toFixed(1)}%
                   </span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Intelligence & Heatmap (Cols: 8) */}
        <div className="xl:col-span-8 space-y-10">
          
          {/* CogniStock Intelligence - Premium Design */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-2">
                <Cpu size={16} /> Neural Synthesis
              </h2>
            </div>
            
            <div className="relative overflow-hidden rounded-[2.5rem] border border-blue-500/20 bg-[#0a0a0a] group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 opacity-50" />
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full group-hover:bg-blue-600/15 transition-colors duration-1000" />
              
            <div className="relative z-10 p-6 md:p-12">
                {isLoading ? (
                  <div className="space-y-4 md:space-y-6">
                    <div className="h-6 md:h-8 bg-white/5 rounded-full w-1/3 animate-pulse" />
                    <div className="space-y-2 md:space-y-3">
                      <div className="h-3 md:h-4 bg-white/5 rounded-full w-full animate-pulse" />
                      <div className="h-3 md:h-4 bg-white/5 rounded-full w-11/12 animate-pulse" />
                      <div className="h-3 md:h-4 bg-white/5 rounded-full w-4/5 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 md:space-y-8">
                    <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                      <div className="mt-1 md:mt-2 p-2 md:p-3 rounded-xl md:rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0 shadow-inner">
                        <Zap size={20} fill="currentColor" className="md:w-6 md:h-6" />
                      </div>
                      <div className="space-y-4 md:space-y-6">
                        <p className="text-zinc-100 text-base md:text-2xl leading-relaxed font-medium tracking-tight italic selection:bg-blue-500/30">
                          {data?.aiSummary || "Analizando flujos globales para generar síntesis estratégica..."}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 pt-4 border-t border-white/5">
                          <Badge icon={<Activity size={10}/>} text="Real-Time Analysis" />
                          <Badge icon={<Globe size={10}/>} text="Global Coverage" />
                          <Badge icon={<ShieldCheck size={10}/>} text="CogniStock v2.4 Core" color="emerald" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* AI Top Picks - Grid of Precision */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <Star size={24} fill="currentColor" className="text-amber-400" />
                NEURAL CONVICTIONS
              </h2>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full border border-white/5">System High Confidence</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-52 bg-white/5 rounded-[2.5rem] animate-pulse" />
              )) : data?.assets?.map((asset: any) => (
                <AssetPrecisionCard key={asset.symbol} asset={asset} />
              ))}
            </div>
          </section>

          {/* Heatmap Redesign */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm md:text-xl font-black text-white flex items-center gap-3">
                <LayoutGrid size={24} className="text-blue-500 hidden xs:block" />
                SECTOR ARCHITECTURE
              </h2>
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-3 md:p-4 min-h-[300px] md:min-h-[350px] shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-transparent pointer-events-none" />
               {isLoading ? <div className="w-full h-[300px] bg-white/5 animate-pulse rounded-[2rem]" /> : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 h-full relative z-10">
                  {sectors.map((sec: any) => {
                    const isPos = sec.changePercent >= 0;
                    const opacity = Math.min(Math.abs(sec.changePercent) / 3, 1) * 0.7 + 0.3;
                    return (
                      <Link href={`/market/sector/${sec.symbol}`} key={sec.symbol} 
                        className="rounded-2xl flex flex-col justify-between p-3 md:p-4 hover:scale-[1.03] transition-all cursor-pointer border border-white/5 shadow-lg group"
                        style={{ backgroundColor: isPos ? `rgba(16, 185, 129, ${opacity})` : `rgba(239, 68, 68, ${opacity})` }}
                      >
                        <div className="flex justify-between items-start">
                           <span className="font-black text-white text-[10px] md:text-sm tracking-tight group-hover:underline truncate">{sec.name}</span>
                           <Info size={10} className="text-white/50 opacity-0 group-hover:opacity-100 transition-opacity hidden xs:block" />
                        </div>
                        <div className="text-right mt-2 md:mt-0">
                          <span className="font-mono text-white text-base md:text-xl font-black drop-shadow-md">{isPos?'+':''}{sec.changePercent?.toFixed(1)}%</span>
                          <p className="text-[8px] md:text-[10px] text-white/80 font-black uppercase tracking-widest">{sec.symbol}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Movers & News (Cols: 4) */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Institutional Screener */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden xl:sticky xl:top-6 shadow-2xl">
            <div className="p-4 md:p-6 border-b border-white/5 space-y-4 md:space-y-6">
               <h3 className="text-[10px] md:text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-2 px-2">
                 <Scan size={14} className="text-blue-500" /> Market Scanner
               </h3>
               <div className="flex bg-black/40 p-1 rounded-xl md:rounded-2xl border border-white/5">
                  {(['gainers', 'losers', 'actives'] as const).map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setMoverTab(tab)} 
                      className={`flex-1 py-2 md:py-2.5 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all ${moverTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>
            </div>
            
            <div className="p-2 md:p-4 space-y-1 md:space-y-2 min-h-[300px] md:min-h-[400px] max-h-[500px] md:max-h-[600px] overflow-y-auto custom-scrollbar">
              {isLoading ? Array(6).fill(0).map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />) :
               moversList.length > 0 ? moversList.map((item: any) => (
                <MoverItem key={item.symbol} item={item} />
               )) : <div className="p-12 text-center text-zinc-600 font-black uppercase text-[10px] tracking-widest">No Data Link</div>}
            </div>
          </div>

          {/* News Intelligence */}
          <section className="space-y-4">
             <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2 px-4">
               <Newspaper size={16} /> Data Stream
             </h3>
             <div className="space-y-3">
                {isLoading ? Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />) :
                 data?.news?.slice(0, 5).map((item: any, idx: number) => (
                   <NewsItem key={idx} item={item} />
                 ))}
             </div>
          </section>

        </div>

      </div>
    </main>
  );
}

function Badge({ icon, text, color = "blue" }: { icon: React.ReactNode, text: string, color?: string }) {
  const styles = color === "emerald" 
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    : "bg-blue-500/10 border-blue-500/20 text-blue-400";
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] ${styles}`}>
      {icon} {text}
    </div>
  );
}

function AssetPrecisionCard({ asset }: { asset: any }) {
  const isPos = asset.changePercent >= 0;
  const chartData = asset.chart.map((p: number, i: number) => ({ i, price: p }));
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-blue-500/30 transition-all flex flex-col justify-between h-full shadow-xl">
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 text-xs shadow-inner">
               {asset.symbol.slice(0, 3)}
            </div>
            <h3 className="font-black text-white text-xl tracking-tight uppercase">{asset.symbol}</h3>
          </div>
          <p className="text-3xl font-mono text-white mt-3 font-black">
            ${asset.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`text-right ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
          <div className="flex items-center gap-1.5 justify-end font-black text-lg">
            {isPos ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
            {Math.abs(asset.changePercent).toFixed(2)}%
          </div>
          <p className="text-xs font-mono font-bold mt-1 opacity-60">
            {isPos ? '+' : ''}{asset.change?.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="relative z-10 mb-6 bg-black/40 border border-white/5 p-4 rounded-2xl h-16 flex items-center">
        <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2 font-medium italic">
          <span className="text-blue-500 font-black mr-2 uppercase not-italic tracking-widest text-[9px]">AI Analysis:</span>
          {asset.reason}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis domain={['auto', 'auto']} hide />
            <Line type="monotone" dataKey="price" stroke={isPos ? '#10b981' : '#ef4444'} strokeWidth={3} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MoverItem({ item }: { item: any }) {
  const isPos = item.percent >= 0;
  return (
    <Link href={`/trading?asset=${item.symbol}`} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5">
       <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] transition-colors ${isPos ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white'}`}>
             {item.symbol.slice(0, 3)}
          </div>
          <div className="min-w-0">
             <p className="text-sm font-black text-white truncate tracking-tight">{item.symbol}</p>
             <p className="text-[9px] font-bold text-blue-500/80 leading-tight line-clamp-1 uppercase tracking-tighter mt-0.5">
                {item.ai_comment}
             </p>
          </div>
       </div>
       <div className="text-right ml-4">
          <p className="text-sm font-black font-mono text-white">${item.price?.toLocaleString()}</p>
          <p className={`text-[10px] font-black font-mono ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
             {isPos ? '+' : ''}{item.percent?.toFixed(2)}%
          </p>
       </div>
    </Link>
  );
}

function NewsItem({ item }: { item: any }) {
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" className="block bg-[#0a0a0a] border border-white/5 p-5 rounded-[2rem] hover:border-blue-500/30 transition-all shadow-lg group">
       <div className="flex justify-between items-start gap-4">
          <h4 className="text-xs font-bold text-zinc-200 leading-relaxed group-hover:text-white transition-colors">{item.title}</h4>
          <ArrowUpRight size={14} className="text-zinc-600 group-hover:text-blue-500 transition-colors shrink-0" />
       </div>
       <div className="flex items-center gap-3 mt-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">
          <span className="text-blue-500">{item.publisher}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          <span>{new Date(item.time * 1000).toLocaleDateString()}</span>
       </div>
    </a>
  );
}
