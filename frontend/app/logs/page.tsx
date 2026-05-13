"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, Search, Filter, Calendar, Brain, 
  ChevronRight, ChevronDown, CheckCircle2, AlertTriangle, 
  LineChart, MessageSquare, Info, Zap
} from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DecisionLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Connect to the analysis and trades data
  const { data: logs, error } = useSWR('http://localhost:8000/api/analysis/recent', fetcher, { refreshInterval: 5000 });
  const { data: trades } = useSWR('http://localhost:8000/api/portfolio/trades', fetcher, { refreshInterval: 5000 });

  const filteredLogs = logs?.filter((log: any) => 
    log.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.recomendacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Registros de Decisión
          </h1>
          <p className="text-zinc-500 font-medium italic">"El rastro del pensamiento autónomo de CogniStock"</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Ticker o recomendación..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 px-10 text-xs focus:outline-none focus:border-blue-500/50 transition-all w-64"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </header>

      {/* Timeline de Decisiones */}
      <div className="space-y-6">
        {filteredLogs?.length > 0 ? (
          filteredLogs.map((log: any, index: number) => (
            <DecisionCard 
              key={log.id} 
              log={log} 
              isExpanded={expandedId === log.id}
              onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
              index={index}
            />
          ))
        ) : (
          <div className="glass-card p-20 rounded-3xl border border-white/5 text-center space-y-4">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <Terminal className="text-zinc-700" size={32} />
             </div>
             <p className="text-zinc-500 font-mono">CogniStock aún no ha registrado procesos de pensamiento.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionCard({ log, isExpanded, onToggle, index }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card rounded-3xl border transition-all duration-300 ${isExpanded ? 'border-blue-500/30 ring-1 ring-blue-500/10' : 'border-white/5 hover:border-white/20'}`}
    >
      <div 
        className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${log.recomendacion === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-400'}`}>
            {log.ticker}
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="text-xl font-bold tracking-tight">{log.ticker}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${log.recomendacion === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {log.recomendacion}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono text-zinc-500">
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>{new Date(log.fecha).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap size={12} className="text-blue-500" />
                <span>Confianza: {log.confianza}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-8">
           <div className="hidden lg:block text-right">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-tighter">Prob. Éxito</p>
              <div className="w-24 h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${log.confianza}%` }} />
              </div>
           </div>
           {isExpanded ? <ChevronDown className="text-zinc-500" /> : <ChevronRight className="text-zinc-500" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-8 space-y-8 bg-black/20">
              {/* Proceso Cognitivo Detallado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-blue-500">
                    <Brain size={18} />
                    <h4 className="text-sm font-bold uppercase tracking-widest">Razonamiento de la IA</h4>
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-sm bg-white/5 p-5 rounded-2xl border border-white/5 font-medium">
                    {log.razonamiento}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertTriangle size={18} />
                    <h4 className="text-sm font-bold uppercase tracking-widest">Factores de Riesgo Analizados</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {log.riesgos?.split(',').map((riesgo: string, i: number) => (
                      <div key={i} className="flex items-center space-x-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-xs text-zinc-400">
                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                        <span>{riesgo.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Datos de Soporte Técnico y Fundamental */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-zinc-400">
                    <LineChart size={16} />
                    <span className="text-xs font-bold uppercase">Datos Técnicos</span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 bg-black/40 p-4 rounded-xl border border-white/5 h-32 overflow-y-auto">
                    {log.datos_tecnicos}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-zinc-400">
                    <MessageSquare size={16} />
                    <span className="text-xs font-bold uppercase">Input Fundamental</span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 bg-black/40 p-4 rounded-xl border border-white/5 h-32 overflow-y-auto">
                    {log.datos_fundamentales}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-zinc-400">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold uppercase">Objetivos de la Operación</span>
                  </div>
                  <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 h-32">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-zinc-500 uppercase">Target</span>
                      <span className="text-xs font-bold text-emerald-500 font-mono">${log.precio_objetivo || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-zinc-500 uppercase">Stop Loss</span>
                      <span className="text-xs font-bold text-red-500 font-mono">${log.stop_loss || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-zinc-500 uppercase">Horizonte</span>
                      <span className="text-xs font-bold text-zinc-300 font-mono uppercase">{log.horizonte || 'WATCH'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
