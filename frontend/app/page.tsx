"use client";

import React from 'react';
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Activity, Wallet, Target, 
  BrainCircuit, ArrowUpRight, ArrowDownRight, Zap, 
  BarChart3, Globe, ShieldCheck, Cpu, Clock, 
  ChevronRight, Sparkles, Database, Layers
} from "lucide-react";
import useSWR from 'swr';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Dashboard() {
  const { data: status } = useSWR('http://localhost:8000/api/portfolio/status', fetcher, { refreshInterval: 5000 });
  const { data: signals } = useSWR('http://localhost:8000/api/analysis/recent', fetcher, { refreshInterval: 10000 });
  const { data: lessons } = useSWR('http://localhost:8000/api/portfolio/lessons', fetcher, { refreshInterval: 30000 });
  const { data: trades } = useSWR('http://localhost:8000/api/portfolio/trades', fetcher, { refreshInterval: 5000 });

  // Mock historical data for the chart if real historical isn't available yet
  const chartData = [
    { name: '09:00', value: 100000 },
    { name: '10:00', value: 101200 },
    { name: '11:00', value: 100800 },
    { name: '12:00', value: 102500 },
    { name: '13:00', value: 104320 },
    { name: '14:00', value: 103900 },
    { name: '15:00', value: 104320 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      {/* SECTION: Top Bar Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-400 bg-clip-text text-transparent">CogniStock</span> 
            <span className="text-zinc-700">|</span> 
            <span className="text-zinc-200 uppercase text-sm tracking-[0.3em] font-light">Terminal v1.0</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium mt-1">Supervisión autónoma activa • Motor Llama-3-70b Groq</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-1.5 rounded-2xl">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                <Cpu size={14} className="text-blue-500" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">IA Operational</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2">
                <Database size={14} className="text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Supabase Cloud</span>
            </div>
        </div>
      </div>

      {/* SECTION: Key Performance Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget 
            label="Equity Total" 
            value={`$${status?.capital_total?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '100,000.00'}`} 
            trend={`${(((status?.capital_total || 100000) / (status?.capital_inicial || 100000)) - 1 * 100 >= 0 ? '+' : '')}${(((status?.capital_total || 100000) / (status?.capital_inicial || 100000) - 1) * 100).toFixed(2)}%`} 
            subLabel="Valor Neto Cartera"
            icon={<Wallet size={20} />}
            color="blue"
        />
        <KPIWidget 
            label="P&L Total" 
            value={`${((status?.capital_total || 100000) - (status?.capital_inicial || 100000)) >= 0 ? '+' : '-'}$${Math.abs((status?.capital_total || 100000) - (status?.capital_inicial || 100000)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
            trend={`${status?.total_trades || 0} Trades`} 
            subLabel="Beneficio Neto Real"
            icon={<TrendingUp size={20} />}
            color="emerald"
        />
        <KPIWidget 
            label="Win Rate" 
            value={`${status?.total_trades > 0 ? ((status?.trades_ganadores / status?.total_trades) * 100).toFixed(1) : '0'}%`} 
            trend={`${status?.trades_ganadores || 0}W / ${status?.trades_perdedores || 0}L`} 
            subLabel="Precisión Algorítmica"
            icon={<Target size={20} />}
            color="purple"
        />
        <KPIWidget 
            label="Memoria Activa" 
            value={lessons?.length || 0} 
            trend="RAG Enabled" 
            subLabel="Lecciones Guardadas"
            icon={<BrainCircuit size={20} />}
            color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Performance Chart */}
        <div className="lg:col-span-2 glass-card rounded-3xl border border-white/5 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Activity size={120} className="text-blue-500" />
            </div>
            
            <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Activity size={18} className="text-blue-500" />
                            Curva de Rendimiento
                        </h2>
                        <p className="text-zinc-500 text-xs mt-1">Simulación de capital acumulado en tiempo real</p>
                    </div>
                    <div className="flex gap-2">
                        {['1H', '1D', '1W', 'ALL'].map(t => (
                            <button key={t} className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${t === '1D' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-zinc-500'}`}>{t}</button>
                        ))}
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis hide />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', borderRadius: '16px', fontSize: '12px' }}
                                itemStyle={{ color: '#3b82f6' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* AI Thought Stream (Right Sidebar) */}
        <div className="glass-card rounded-3xl border border-white/5 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles size={18} className="text-orange-400" />
                    Live Brain Stream
                </h2>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Listening</span>
                </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {lessons?.slice(0, 5).map((lesson: any, i: number) => (
                    <div key={lesson.id} className="relative pl-6 border-l border-zinc-800 pb-6 group last:pb-0">
                        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700 group-hover:bg-orange-500 transition-colors" />
                        <div className="space-y-1">
                            <span className="text-[10px] font-mono text-zinc-600 uppercase">{new Date(lesson.fecha).toLocaleTimeString()} • {lesson.ticker}</span>
                            <h3 className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{lesson.titulo}</h3>
                            <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">{lesson.leccion}</p>
                        </div>
                    </div>
                )) || <p className="text-zinc-600 text-xs italic">El cerebro está en reposo...</p>}
            </div>
            
            <button className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                Ver arquitectura neuronal
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signal Heatmap */}
          <div className="glass-card rounded-3xl border border-white/5 p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Zap size={18} className="text-yellow-400" />
                        Señales de Alta Confianza
                    </h2>
                    <ChevronRight size={16} className="text-zinc-600" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {signals?.slice(0, 4).map((sig: any) => (
                        <div key={sig.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center font-bold text-sm group-hover:text-blue-400">
                                    {sig.ticker}
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${sig.recomendacion === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {sig.recomendacion}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                                    <span>Confianza</span>
                                    <span className="text-blue-500 font-mono">{sig.confianza}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600" style={{ width: `${sig.confianza}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
          </div>

          {/* Quick Assets Table */}
          <div className="glass-card rounded-3xl border border-white/5 p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Layers size={18} className="text-emerald-400" />
                        Top Exposure
                    </h2>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Market Live</span>
                </div>
                <div className="space-y-3">
                    {trades?.filter((t: any) => t.estado === 'OPEN').slice(0, 4).map((trade: any) => (
                        <div key={trade.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-500">
                                    {trade.ticker}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-200">{trade.ticker}</p>
                                    <p className="text-[10px] text-zinc-500">{trade.acciones} Acciones</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-mono font-bold text-zinc-200">${(trade.precio_actual * trade.acciones).toLocaleString()}</p>
                                <p className={`text-[10px] font-bold ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl_porcentaje?.toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    )) || <p className="text-zinc-600 text-xs py-10 text-center italic font-mono">Cartera 100% Líquida</p>}
                </div>
          </div>
      </div>
    </motion.div>
  );
}

function KPIWidget({ label, value, trend, subLabel, icon, color }: any) {
  const colorMap: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  };

  return (
    <div className="glass-card p-6 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]} transition-transform group-hover:scale-110 duration-500`}>
          {icon}
        </div>
        <div className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${colorMap[color]}`}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
        <p className="text-3xl font-black mt-1 tracking-tighter text-white">{value}</p>
        <p className="text-zinc-600 text-[10px] font-mono mt-1 uppercase tracking-widest">{subLabel}</p>
      </div>
    </div>
  );
}
