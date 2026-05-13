"use client";

import React from 'react';
import { motion } from "framer-motion";
import { Zap, ShieldAlert, Info, Search, TrendingUp, TrendingDown } from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SignalsPage() {
  const { data: analysis } = useSWR('http://localhost:8000/api/analysis/recent', fetcher, { refreshInterval: 10000 });

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Señales AI Reales
          </h1>
          <p className="text-zinc-500 font-medium">Análisis predictivo basado en datos de mercado actuales</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {analysis?.map((sig: any, i: number) => (
          <motion.div 
            key={sig.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 rounded-3xl border border-white/5 space-y-8 hover:border-blue-500/20 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center space-x-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${sig.recomendacion === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-400'}`}>
                  {sig.ticker}
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h2 className="text-2xl font-bold tracking-tight">{sig.ticker}</h2>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${sig.recomendacion === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {sig.recomendacion}
                    </span>
                  </div>
                  <p className="text-zinc-500 font-mono text-xs">{new Date(sig.fecha).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-12 px-8 py-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter mb-1">Confianza</p>
                  <p className="text-xl font-mono font-black text-blue-500">{sig.confianza}%</p>
                </div>
                <div className="w-[1px] h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter mb-1">Riesgo</p>
                  <p className={`text-xl font-mono font-black ${sig.nivel_riesgo === 'BAJO' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {sig.nivel_riesgo}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-white/5">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold flex items-center space-x-2 text-zinc-400">
                  <Info size={16} />
                  <span>Razonamiento Estratégico AI</span>
                </h3>
                <p className="text-zinc-300 leading-relaxed text-sm">
                  {sig.razonamiento}
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold flex items-center space-x-2 text-zinc-400">
                    <ShieldAlert size={16} className="text-red-500" />
                    <span>Riesgos</span>
                  </h3>
                  <div className="text-xs text-zinc-500 leading-relaxed">
                    {sig.riesgos}
                  </div>
                </div>
                
                <div className="pt-4 space-y-3 border-t border-white/5">
                   <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Precio Objetivo</span>
                      <span className="font-mono font-bold text-emerald-500">${sig.precio_objetivo || 'N/A'}</span>
                   </div>
                   <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Stop Loss</span>
                      <span className="font-mono font-bold text-red-500">${sig.stop_loss || 'N/A'}</span>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )) || <p className="text-zinc-600 italic text-center py-20">Aún no se han generado señales reales.</p>}
      </div>
    </div>
  );
}
