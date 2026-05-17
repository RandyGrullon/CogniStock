"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Activity, Wallet, Target, 
  BrainCircuit, ArrowUpRight, ArrowDownRight, Zap, 
  BarChart3, Globe, ShieldCheck, Cpu, Clock, 
  ChevronRight, Sparkles, Database, Layers,
  Scan, Network, History, ArrowRightLeft, Shield, LineChart, ArrowRight
} from "lucide-react";
import useSWR from 'swr';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import NeuralArchitectureModal from '@/components/NeuralArchitectureModal';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Dashboard() {
  const { data: status, isLoading: loadingStatus } = useSWR('/api/portfolio/status', fetcher, { refreshInterval: 5000 });
  const { data: signals } = useSWR('/api/analysis/recent', fetcher, { refreshInterval: 10000 });
  const { data: lessons } = useSWR('/api/portfolio/lessons', fetcher, { refreshInterval: 30000 });
  const { data: trades } = useSWR('/api/portfolio/trades', fetcher, { refreshInterval: 5000 });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openTrades = useMemo(() => trades?.filter((t: any) => t.estado === 'OPEN') || [], [trades]);
  const totalPnL = useMemo(() => openTrades.reduce((acc: number, t: any) => acc + (t.pnl || 0), 0), [openTrades]);
  
  const winRate = useMemo(() => {
    if (!status?.total_trades || status.total_trades === 0) return 0;
    return (status.trades_ganadores / status.total_trades) * 100;
  }, [status]);

  // Mock historical data for the chart - in a real app this would come from an API
  const performanceData = [
    { time: '00:00', val: 98500 },
    { time: '04:00', val: 99200 },
    { time: '08:00', val: 100500 },
    { time: '12:00', val: 102800 },
    { time: '16:00', val: 101900 },
    { time: '20:00', val: 103500 },
    { time: '23:59', val: 104320 },
  ];

  return (
    <main className="flex-1 p-6 space-y-8 overflow-y-auto bg-[#050505] text-zinc-300 selection:bg-blue-500/30">
      
      {/* Header Elite */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Command & Control Center</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white flex items-center gap-4 uppercase italic">
            Neural Dashboard
          </h1>
          <p className="text-zinc-500 font-medium max-w-xl leading-relaxed">
            Monitor central de operaciones autónomas. CogniStock v2.4 procesando flujos globales y optimizando ejecución de capital.
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="px-6 py-4 bg-zinc-900/40 border border-white/5 rounded-2xl flex flex-col items-end shadow-2xl">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Engine Status</span>
              <span className="text-emerald-400 font-mono font-black text-sm uppercase flex items-center gap-2">
                Operational <Scan size={14} />
              </span>
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="p-4 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-2xl transition-all shadow-xl active:scale-95"
           >
             <Network size={24} />
           </button>
        </div>
      </header>

      {/* KPI Matrix Elite */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget 
            label="Net Equity" 
            value={`$${status?.capital_total?.toLocaleString(undefined, {minimumFractionDigits: 0}) || '---'}`} 
            trend="+4.2%" 
            subLabel="Total Assets Value"
            icon={<Wallet size={20} />}
            color="blue"
            positive={true}
        />
        <KPIWidget 
            label="Alpha Yield" 
            value={`${totalPnL >= 0 ? '+' : ''}$${Math.abs(totalPnL).toLocaleString(undefined, {minimumFractionDigits: 0})}`} 
            trend={`${openTrades.length} Active`} 
            subLabel="Unrealized Performance"
            icon={<Activity size={20} />}
            color="emerald"
            positive={totalPnL >= 0}
        />
        <KPIWidget 
            label="Win Ratio" 
            value={`${winRate.toFixed(1)}%`} 
            trend={`${status?.trades_ganadores || 0}W / ${status?.trades_perdedores || 0}L`} 
            subLabel="Cognitive Precision"
            icon={<Target size={20} />}
            color="purple"
            positive={winRate > 50}
        />
        <KPIWidget 
            label="Neural Memory" 
            value={lessons?.length || 0} 
            trend="RAG Active" 
            subLabel="Cumulative Insights"
            icon={<BrainCircuit size={20} />}
            color="orange"
            positive={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Central Intelligence Chart (Cols: 8) */}
        <div className="lg:col-span-8 glass-card rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden group shadow-2xl bg-[#0a0a0a]">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <BarChart3 size={150} className="text-blue-500" />
            </div>
            
            <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                           <LineChart className="text-blue-500" size={24} />
                           Capital Evolution
                        </h2>
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Historical Growth Simulation</p>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        {['1H', '1D', '1W', 'MAX'].map(t => (
                            <button key={t} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${t === '1D' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-zinc-500 hover:text-white'}`}>{t}</button>
                        ))}
                    </div>
                </div>

                <div className="h-[350px] w-full bg-black/20 rounded-[2rem] p-4 border border-white/[0.02]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData}>
                            <defs>
                                <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="time" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 'bold' }} />
                            <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                                itemStyle={{ color: '#3b82f6' }}
                                cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorPerf)" animationDuration={2000} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
                   <div className="space-y-1">
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Drawdown Max</span>
                      <p className="text-sm font-mono font-black text-red-400/80">0.82%</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Sharpe Ratio</span>
                      <p className="text-sm font-mono font-black text-emerald-400">3.41</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Neural Confidence</span>
                      <p className="text-sm font-mono font-black text-blue-400">High</p>
                   </div>
                </div>
            </div>
        </div>

        {/* AI Thought Stream Elite (Cols: 4) */}
        <div className="lg:col-span-4 space-y-6">
            <div className="glass-card rounded-[2.5rem] border border-blue-500/20 p-8 space-y-8 bg-[#0a0a0a] h-full shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5"><BrainCircuit size={60} className="text-blue-500" /></div>
                
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                        <Sparkles size={20} className="text-orange-400" />
                        Live Brain
                    </h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Synch</span>
                    </div>
                </div>

                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                    {lessons && lessons.length > 0 ? lessons.slice(0, 6).map((lesson: any) => (
                        <div key={lesson.id} className="relative pl-6 border-l-2 border-white/5 pb-8 group last:pb-2 transition-all">
                            <div className="absolute left-[-6.5px] top-0 w-3 h-3 rounded-full bg-zinc-900 border-2 border-zinc-700 group-hover:bg-blue-500 group-hover:border-blue-400 transition-all duration-300 shadow-lg" />
                            <div className="space-y-2 group-hover:translate-x-1 transition-transform">
                                <div className="flex justify-between items-center">
                                   <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-tighter">{new Date(lesson.fecha).toLocaleTimeString()} • {lesson.ticker}</span>
                                   <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${lesson.tipo === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{lesson.tipo}</span>
                                </div>
                                <h3 className="text-sm font-black text-zinc-200 group-hover:text-white transition-colors tracking-tight">{lesson.titulo}</h3>
                                <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 italic">&quot;{lesson.leccion}&quot;</p>
                            </div>
                        </div>
                    )) : (
                       <div className="py-20 text-center space-y-4 opacity-30">
                          <History size={40} className="mx-auto text-zinc-700" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting synaptic inputs...</p>
                       </div>
                    )}
                </div>
                
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-5 rounded-[1.8rem] bg-white text-black hover:bg-blue-500 hover:text-white text-[11px] font-black uppercase tracking-[0.25em] transition-all shadow-xl active:scale-95 group overflow-hidden relative"
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                       Arquitectura Neuronal
                       <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        </div>
      </div>

      {/* Grid: Signals and Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Signal Pulse Center */}
          <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                        <Zap size={24} fill="currentColor" className="text-yellow-400" />
                        Priority Signals
                    </h2>
                    <Link href="/signals" className="text-[10px] font-black text-zinc-500 hover:text-blue-500 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                       Full Intelligence Hub <ChevronRight size={12} />
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {signals?.slice(0, 4).map((sig: any) => (
                        <div key={sig.id} className="p-6 rounded-[2rem] bg-[#0a0a0a] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={40} className="text-blue-500" /></div>
                            <div className="flex justify-between items-start mb-5 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center font-black text-lg text-zinc-400 group-hover:text-blue-400 transition-colors">
                                    {sig.ticker.slice(0, 3)}
                                </div>
                                <div className="text-right">
                                   <span className={`text-[10px] px-3 py-1 rounded-xl font-black uppercase tracking-widest ${sig.recomendacion === 'BUY' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                                       {sig.recomendacion}
                                   </span>
                                   <p className="text-[8px] font-mono text-zinc-600 mt-2 uppercase">{new Date(sig.fecha).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                    <span>Neural Conviction</span>
                                    <span className="text-blue-400 font-mono">{sig.confianza}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/[0.02]">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${sig.confianza}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-blue-600 to-indigo-500" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
          </section>

          {/* Active Exposure Feed */}
          <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                        <ShieldCheck size={24} className="text-emerald-500" />
                        Active Exposures
                    </h2>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Portfolio
                    </span>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-4 min-h-[300px] shadow-2xl flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-transparent pointer-events-none" />
                    <div className="space-y-3 relative z-10 overflow-y-auto max-h-[350px] custom-scrollbar pr-1">
                        {openTrades.length > 0 ? openTrades.slice(0, 5).map((trade: any) => {
                            const isPos = trade.pnl >= 0;
                            return (
                                <div key={trade.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/[0.02] hover:bg-white/[0.03] transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black text-xs transition-all group-hover:scale-105 ${isPos ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                                            {trade.ticker.slice(0, 3)}
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-white tracking-tighter uppercase">{trade.ticker}</p>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{trade.acciones} Units @ {trade.tipo}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-mono font-black text-white tracking-tighter">${(trade.precio_actual * trade.acciones).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                        <div className={`flex items-center justify-end gap-1 font-mono font-black text-[11px] mt-1 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                            {isPos ? '+' : ''}{trade.pnl_porcentaje?.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                           <div className="flex flex-col items-center justify-center py-20 opacity-20 space-y-4">
                              <Shield size={48} className="text-zinc-600" />
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Portfolio is 100% Liquid</p>
                           </div>
                        )}
                    </div>
                    
                    <div className="pt-6 border-t border-white/5 mt-4 flex items-center justify-between px-2 relative z-10">
                       <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Capital Utilization</span>
                       <div className="flex items-center gap-3">
                          <div className="w-32 h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/[0.03]">
                             <div className="h-full bg-emerald-500" style={{ width: `${Math.min(((status?.capital_total - status?.capital_disponible) / status?.capital_total) * 100, 100)}%` }} />
                          </div>
                          <span className="text-[9px] font-mono font-black text-zinc-400">{Math.round(((status?.capital_total - status?.capital_disponible) / status?.capital_total) * 100)}%</span>
                       </div>
                    </div>
                </div>
          </section>
      </div>

      <NeuralArchitectureModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Decorative Neural Grid BG */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" 
        style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />
    </main>
  );
}

function KPIWidget({ label, value, trend, subLabel, icon, color, positive }: any) {
  const colorMap: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/10',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20 shadow-orange-500/10',
  };

  return (
    <div className="glass-card p-6 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden bg-[#0a0a0a] shadow-xl">
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className={`p-3 rounded-2xl ${colorMap[color]} transition-all duration-500 group-hover:scale-110 shadow-inner border`}>
          {icon}
        </div>
        <div className={`text-[10px] font-black px-3 py-1 rounded-xl border flex items-center gap-1.5 ${positive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
        <p className="text-3xl font-black mt-2 tracking-tighter text-white font-mono">{value}</p>
        <div className="flex items-center gap-2 mt-2">
           <div className={`w-1 h-1 rounded-full ${positive ? 'bg-emerald-500' : 'bg-red-500'}`} />
           <p className="text-zinc-600 text-[9px] font-bold mt-0.5 uppercase tracking-widest">{subLabel}</p>
        </div>
      </div>
    </div>
  );
}
