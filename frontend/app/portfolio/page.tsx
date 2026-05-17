"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, TrendingDown, DollarSign, 
  PieChart, Clock, ArrowUpRight, ArrowDownRight, 
  BarChart3, Layers, Wallet, History, 
  ArrowRightLeft, Activity, Target, ShieldCheck, 
  ChevronRight, Download, Filter, Info, Cpu
} from "lucide-react";
import useSWR from 'swr';
import { 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip as ReTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PortfolioPage() {
  const { data: status, isLoading: loadingStatus } = useSWR('/api/portfolio/status', fetcher, { refreshInterval: 5000 });
  const { data: trades, isLoading: loadingTrades } = useSWR('/api/portfolio/trades', fetcher, { refreshInterval: 5000 });

  const openTrades = useMemo(() => trades?.filter((t: any) => t.estado === 'OPEN') || [], [trades]);
  const closedTrades = useMemo(() => trades?.filter((t: any) => t.estado === 'CLOSED') || [], [trades]);

  const totalPnL = useMemo(() => openTrades.reduce((acc: number, t: any) => acc + (t.pnl || 0), 0), [openTrades]);
  const winRate = useMemo(() => {
    if (!status?.total_trades || status.total_trades === 0) return 0;
    return (status.trades_ganadores / status.total_trades) * 100;
  }, [status]);

  // Data for Allocation Chart
  const allocationData = useMemo(() => {
    const assets = openTrades.map((t: any) => ({ name: t.ticker, value: t.precio_actual * t.acciones }));
    const cash = { name: 'Available Cash', value: status?.capital_disponible || 0 };
    return assets.length > 0 ? [...assets, cash] : [cash];
  }, [openTrades, status]);

  const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#34d399', '#fbbf24'];

  return (
    <main className="flex-1 p-6 space-y-8 overflow-y-auto bg-[#050505] text-zinc-300">
      {/* Header Elite */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Capital Management Division</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white flex items-center gap-4">
            <ShieldCheck className="text-blue-500" size={40} />
            ASSET CONTROL
          </h1>
          <p className="text-zinc-500 font-medium max-w-xl leading-relaxed">
            Visión panorámica de exposición, métricas de rendimiento neural y gestión de liquidez institucional.
          </p>
        </div>

        <div className="flex gap-3">
            <button className="px-5 py-3 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 shadow-xl active:scale-95">
                <Download size={14} />
                <span>Export Report</span>
            </button>
            <button className="px-5 py-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 active:scale-95">
                <ArrowRightLeft size={14} />
                <span>Rebalance Neural</span>
            </button>
        </div>
      </header>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Net Equity Value" 
          value={`$${status?.capital_total?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}`} 
          subValue="Total Portfolio Value"
          icon={<Wallet className="text-blue-500" size={18} />} 
          trend="+12.4%"
          positive={true}
        />
        <MetricCard 
          label="Unrealized P&L" 
          value={`$${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subValue={`${openTrades.length} Active Positions`}
          icon={<Activity className={`text-emerald-500 ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`} size={18} />} 
          trend={`${totalPnL >= 0 ? '+' : ''}${(status?.capital_total ? (totalPnL / status.capital_total) * 100 : 0).toFixed(2)}%`}
          positive={totalPnL >= 0}
        />
        <MetricCard 
          label="AI Win Rate" 
          value={`${winRate.toFixed(1)}%`} 
          subValue={`Based on ${status?.total_trades || 0} Trades`}
          icon={<Target className="text-purple-500" size={18} />} 
          trend="Optimal"
          positive={winRate > 50}
        />
        <MetricCard 
          label="Liquid Capital" 
          value={`$${status?.capital_disponible?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}`} 
          subValue="Ready to Deploy"
          icon={<DollarSign className="text-orange-500" size={18} />} 
          trend="100% Secure"
          positive={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Allocation & Intelligence (Cols: 4) */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden group h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-50 pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center space-x-3 text-white">
                        <Layers size={18} className="text-blue-500" />
                        <span>Asset Allocation</span>
                    </h2>
                    <div className="p-2 bg-white/5 rounded-xl text-zinc-500"><PieChart size={16} /></div>
                </div>

                <div className="h-[280px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie
                                data={allocationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                            >
                                {allocationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                                ))}
                            </Pie>
                            <ReTooltip 
                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </RePieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Diversification</span>
                        <span className="text-2xl font-black text-white font-mono">{allocationData.length - 1} Assets</span>
                    </div>
                </div>

                <div className="mt-8 space-y-4 relative z-10 overflow-y-auto max-h-[200px] custom-scrollbar pr-2">
                    {allocationData.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between group/item">
                            <div className="flex items-center space-x-3">
                                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-[11px] font-bold text-zinc-400 group-hover/item:text-white transition-colors uppercase tracking-wider">{entry.name}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-mono font-black text-white">${entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">
                                    {status?.capital_total ? ((entry.value / status.capital_total) * 100).toFixed(1) : 0}%
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Active Positions Technical View (Cols: 8) */}
        <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                    <BarChart3 size={24} className="text-emerald-500" />
                    OPERATIONAL EXPOSURES
                </h2>
                <div className="flex items-center gap-3">
                  <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Streaming
                  </div>
                  <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors"><Filter size={14}/></button>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                                <th className="px-8 py-5">Instrument / Size</th>
                                <th className="px-8 py-5">Entry Matrix</th>
                                <th className="px-8 py-5">Market Value</th>
                                <th className="px-8 py-5 text-right">Performance Alpha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {openTrades.length > 0 ? openTrades.map((trade: any) => {
                                const isPos = trade.pnl >= 0;
                                return (
                                    <tr key={trade.id} className="hover:bg-white/[0.01] transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-[1rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-500 text-sm">
                                                    {trade.ticker.slice(0, 3)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white text-lg tracking-tight">{trade.ticker}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${trade.tipo === 'BUY' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{trade.tipo}</span>
                                                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">{trade.acciones} UNITS</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                              <p className="text-xs font-mono font-bold text-zinc-300">${trade.precio_entrada.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                              <p className="text-[9px] font-black text-zinc-600 uppercase">Avg Cost Basis</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                              <p className="text-xs font-mono font-bold text-white">${trade.precio_actual.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                              <p className="text-[9px] font-black text-blue-500/80 uppercase">Real-Time Quote</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className={`text-lg font-black font-mono flex items-center justify-end ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {isPos ? <TrendingUp size={16} className="mr-2" /> : <TrendingDown size={16} className="mr-2" />}
                                                {isPos ? '+' : ''}{trade.pnl_porcentaje?.toFixed(2)}%
                                            </div>
                                            <p className={`text-[11px] font-mono font-bold ${isPos ? 'text-emerald-500/60' : 'text-red-500/60'}`}>
                                                {isPos ? '+' : ''}${trade.pnl?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                          <div className="p-4 bg-white/5 rounded-full text-zinc-700"><History size={40} /></div>
                                          <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em]">No active exposures in database</p>
                                          <Link href="/trading" className="text-[10px] font-black text-blue-500 hover:text-blue-400 underline uppercase tracking-widest">Deploy Capital ↗</Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>

      {/* Execution Ledger (History) */}
      <section className="space-y-6 pt-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <History size={24} className="text-purple-500" />
              EXECUTION LEDGER
            </h2>
            <Link href="/logs" className="text-[10px] font-black text-zinc-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-2 transition-colors">
               Full History <ChevronRight size={12} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {closedTrades.length > 0 ? closedTrades.slice(0, 8).map((trade: any) => (
                  <div key={trade.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] flex items-center justify-between group hover:border-purple-500/30 transition-all shadow-xl">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${trade.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {trade.ticker.slice(0, 3)}
                        </div>
                        <div>
                            <p className="font-black text-white tracking-tight uppercase">{trade.ticker}</p>
                            <p className="text-[9px] text-zinc-600 font-bold font-mono">{new Date(trade.fecha_salida).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                          <p className={`text-sm font-black font-mono ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                             {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                          <div className="flex items-center justify-end gap-1.5 mt-0.5">
                             <div className="w-1 h-1 rounded-full bg-zinc-700" />
                             <p className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter">Settled</p>
                          </div>
                      </div>
                  </div>
              )) : (
                <div className="col-span-full py-20 bg-[#0a0a0a] border border-dashed border-white/5 rounded-[2rem] text-center">
                   <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Execution ledger empty</p>
                </div>
              )}
          </div>
      </section>

      {/* Neural Link Info Footer */}
      <footer className="pt-12 pb-6 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 opacity-50">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <Cpu size={14} className="text-blue-500" />
               <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">CogniStock v2.4-Alpha</span>
            </div>
            <div className="flex items-center gap-2">
               <ShieldCheck size={14} className="text-emerald-500" />
               <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">End-to-End Neural Encryption</span>
            </div>
         </div>
         <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 italic">
            "Market dominance through superior cognitive processing"
         </p>
      </footer>
    </main>
  );
}

function MetricCard({ label, value, subValue, icon, trend, positive }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0a0a0a] p-6 rounded-[2rem] border border-white/5 flex flex-col space-y-5 group hover:border-blue-500/30 transition-all shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all text-zinc-400 group-hover:text-blue-400">
          {icon}
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black font-mono border ${positive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <div className="flex items-center gap-1.5">
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        </div>
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
        <p className="text-3xl font-black mt-2 tracking-tighter text-white font-mono">{value}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-1 h-1 rounded-full bg-blue-500" />
          <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">{subValue}</p>
        </div>
      </div>
    </motion.div>
  );
}
