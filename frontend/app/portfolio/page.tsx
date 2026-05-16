"use client";

import React from 'react';
import { motion } from "framer-motion";
import { 
  Briefcase, TrendingUp, TrendingDown, DollarSign, 
  PieChart, Clock, ArrowUpRight, ArrowDownRight, 
  BarChart3, Layers, Wallet, History, Search,
  ArrowRightLeft
} from "lucide-react";
import useSWR from 'swr';
import { 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip as ReTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PortfolioPage() {
  const { data: status } = useSWR('/api/portfolio/status', fetcher, { refreshInterval: 5000 });
  const { data: trades } = useSWR('/api/portfolio/trades', fetcher, { refreshInterval: 5000 });

  const openTrades = trades?.filter((t: any) => t.estado === 'OPEN') || [];
  const closedTrades = trades?.filter((t: any) => t.estado === 'CLOSED') || [];

  // Data for Allocation Chart
  const allocationData = openTrades.length > 0 
    ? openTrades.map((t: any) => ({ name: t.ticker, value: t.precio_actual * t.acciones }))
    : [{ name: 'Cash', value: status?.capital_disponible || 100000 }];

  const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Gestión de Activos
          </h1>
          <p className="text-zinc-500 font-medium">Control total de tu capital y rendimiento en tiempo real</p>
        </div>
        <div className="flex gap-3">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-lg shadow-blue-500/20">
                <ArrowRightLeft size={14} />
                <span>Ejecutar Rebalanceo</span>
            </button>
        </div>
      </header>

      {/* Grid de KPIs Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Valor Total Cuenta" 
          value={`$${status?.capital_total?.toLocaleString() || '100,000'}`} 
          subValue="Patrimonio Neto"
          icon={<Wallet className="text-blue-500" />} 
          trend="+4.3%"
          positive={true}
        />
        <MetricCard 
          label="P&L No Realizado" 
          value={`$${openTrades.reduce((acc: number, t: any) => acc + (t.pnl || 0), 0).toLocaleString()}`} 
          subValue="Posiciones abiertas"
          icon={<TrendingUp className="text-emerald-500" />} 
          trend="+2.1%"
          positive={true}
        />
        <MetricCard 
          label="P&L Realizado" 
          value={`$${closedTrades.reduce((acc: number, t: any) => acc + (t.pnl || 0), 0).toLocaleString()}`} 
          subValue="Trades cerrados"
          icon={<History className="text-purple-500" />} 
          trend="-0.5%"
          positive={false}
        />
        <MetricCard 
          label="Cash Disponible" 
          value={`$${status?.capital_disponible?.toLocaleString() || '100,000'}`} 
          subValue="Poder de compra"
          icon={<DollarSign className="text-orange-500" />} 
          trend="100%"
          positive={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Distribución */}
        <div className="lg:col-span-1 glass-card rounded-3xl border border-white/5 p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold flex items-center space-x-2">
                    <PieChart size={18} className="text-blue-500" />
                    <span>Asset Allocation</span>
                </h2>
                <Layers size={16} className="text-zinc-600" />
            </div>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {allocationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <ReTooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                    </RePieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3">
                {allocationData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-zinc-400 font-medium">{entry.name}</span>
                        </div>
                        <span className="font-mono font-bold">${entry.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Tabla de Posiciones Activas */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                    <BarChart3 size={20} className="text-emerald-500" />
                    <span>Posiciones Activas</span>
                </h2>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    Live Feed • Actualizado cada 5s
                </div>
            </div>

            <div className="glass-card rounded-3xl border border-white/5 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                    <thead className="bg-white/5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Activo</th>
                            <th className="px-6 py-4">Exposición</th>
                            <th className="px-6 py-4">Precio Entrada</th>
                            <th className="px-6 py-4">Precio Actual</th>
                            <th className="px-6 py-4 text-right">P&L (%)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {openTrades.length > 0 ? openTrades.map((trade: any) => (
                            <tr key={trade.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                <td className="px-6 py-5">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-bold text-blue-500">
                                            {trade.ticker}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{trade.ticker}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Equity • {trade.acciones} shares</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-sm font-mono font-bold">${(trade.precio_actual * trade.acciones).toLocaleString()}</p>
                                    <div className="w-16 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: '45%' }} />
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-sm text-zinc-400 font-mono">${trade.precio_entrada.toLocaleString()}</td>
                                <td className="px-6 py-5 text-sm text-zinc-200 font-mono">${trade.precio_actual.toLocaleString()}</td>
                                <td className="px-6 py-5 text-right">
                                    <div className={`text-sm font-bold font-mono flex items-center justify-end ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {trade.pnl >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                                        {trade.pnl_porcentaje?.toFixed(2)}%
                                    </div>
                                    <p className={`text-[10px] font-mono ${trade.pnl >= 0 ? 'text-emerald-500/50' : 'text-red-500/50'}`}>
                                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toLocaleString()}
                                    </p>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-zinc-600 italic font-mono text-xs">
                                    No hay posiciones abiertas registradas en CogniStock
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Historial de Actividad Reciente */}
      <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Clock size={20} className="text-purple-500" />
            <span>Historial de Ejecuciones</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {closedTrades.slice(0, 6).map((trade: any) => (
                  <div key={trade.id} className="glass-card p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${trade.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {trade.ticker}
                        </div>
                        <div>
                            <p className="font-bold text-sm">{trade.ticker}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{new Date(trade.fecha_salida).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                          <p className={`text-sm font-bold font-mono ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                             {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">Cerrado</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, icon, trend, positive }: any) {
  return (
    <div className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col space-y-4 group hover:border-blue-500/30 transition-all">
      <div className="flex items-center justify-between">
        <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
        <div className={`flex items-center space-x-1 text-xs font-mono font-bold ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
          {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{trend}</span>
        </div>
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black mt-1 tracking-tight text-white">{value}</p>
        <p className="text-zinc-600 text-[10px] font-mono mt-1">{subValue}</p>
      </div>
    </div>
  );
}
