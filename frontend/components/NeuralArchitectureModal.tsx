"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Brain, Zap, Database, Search, 
  ArrowRight, Cpu, Network, Shield, 
  Sparkles, Layers, Activity, History
} from 'lucide-react';

interface NeuralArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NeuralArchitectureModal({ isOpen, onClose }: NeuralArchitectureModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-600/20 rounded-2xl">
                <Network className="text-blue-500" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tighter uppercase">Arquitectura Neural CogniStock</h2>
                <p className="text-[10px] text-zinc-500 font-mono tracking-widest">SISTEMA AUTÓNOMO DE TERCERA GENERACIÓN</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
            
            {/* High Level Flow */}
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent -translate-y-1/2 hidden lg:block" />
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
                <ArchitectureNode 
                  icon={<Database className="text-cyan-400" />}
                  title="Ingesta"
                  desc="Captura masiva de Ticks vía WebSockets (TradingView) y Yahoo Finance."
                  color="cyan"
                />
                <ArchitectureNode 
                  icon={<Cpu className="text-blue-400" />}
                  title="Pre-Proceso"
                  desc="Cálculo vectorial de RSI, MACD, Medias Móviles y Tendencias."
                  color="blue"
                />
                <ArchitectureNode 
                  icon={<Brain className="text-purple-400" />}
                  title="Inferencia"
                  desc="LLM Llama-3 (Groq) analiza el contexto técnico y fundamental."
                  color="purple"
                />
                <ArchitectureNode 
                  icon={<Shield className="text-emerald-400" />}
                  title="Ejecución"
                  desc="Gestión de riesgo dinámica y persistencia en Supabase."
                  color="emerald"
                />
              </div>
            </div>

            {/* Detailed Layers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
              
              {/* Left Column: Data & Logic */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layers size={14} /> Capas de Procesamiento
                </h3>
                
                <LayerItem 
                  title="Capa de Memoria (RAG)" 
                  content="El sistema recupera 'lecciones' pasadas de la base de datos antes de cada decisión, evitando repetir errores históricos." 
                  status="Active"
                />
                <LayerItem 
                  title="Filtro de Probabilidad" 
                  content="Solo se ejecutan órdenes con un índice de confianza > 70%. El resto se descarta o se mantiene en observación." 
                  status="Active"
                />
                <LayerItem 
                  title="Scheduler Autónomo" 
                  content="GitHub Actions orquestado para disparar ciclos de análisis global 24/5 sin intervención humana." 
                  status="Live"
                />
              </div>

              {/* Right Column: Visual Preview / Tech Stack */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Cpu size={14} /> Stack Tecnológico
                </h3>
                
                <div className="bg-black/40 rounded-2xl border border-white/5 p-6 space-y-4">
                  <TechBadge name="Next.js 14" category="Core" />
                  <TechBadge name="Supabase" category="Database / Auth" />
                  <TechBadge name="Groq / Llama 3" category="Inference Engine" />
                  <TechBadge name="TradingView WS" category="Market Data" />
                  <TechBadge name="GitHub Actions" category="Orchestration" />
                  <TechBadge name="Framer Motion" category="Interface" />
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Zap className="text-emerald-500" size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Optimización Edge</h4>
                    <p className="text-[11px] text-zinc-500 mt-1">Todas las rutas de análisis corren en el Edge de Vercel para latencia mínima.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-zinc-900/30 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-6 text-[10px] font-mono text-zinc-600">
              <span className="flex items-center gap-1.5"><Activity size={10} className="text-blue-500" /> STATUS: OPERATIONAL</span>
              <span className="flex items-center gap-1.5"><History size={10} className="text-purple-500" /> VERSION: 3.0.4-NEURAL</span>
            </div>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-zinc-200 transition-all uppercase tracking-widest"
            >
              Cerrar Vista
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ArchitectureNode({ icon, title, desc, color }: any) {
  const colors: any = {
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  };

  return (
    <div className={`p-5 rounded-3xl border ${colors[color]} space-y-3 relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 -mr-2 -mt-2 w-12 h-12 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      <h3 className="font-bold text-white tracking-tight">{title}</h3>
      <p className="text-[11px] leading-relaxed opacity-60">{desc}</p>
    </div>
  );
}

function LayerItem({ title, content, status }: any) {
  return (
    <div className="space-y-2 group">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{title}</h4>
        <span className="text-[8px] font-mono px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20 uppercase font-black">{status}</span>
      </div>
      <p className="text-[11px] text-zinc-500 leading-relaxed">{content}</p>
    </div>
  );
}

function TechBadge({ name, category }: any) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/[0.03] last:border-none">
      <span className="text-[11px] font-mono text-zinc-400">{name}</span>
      <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">{category}</span>
    </div>
  );
}
