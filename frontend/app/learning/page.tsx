"use client";

import React from 'react';
import { motion } from "framer-motion";
import { GraduationCap, Brain, History, Star, Tag } from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function LearningPage() {
  const { data: lessons } = useSWR('http://localhost:8000/api/portfolio/lessons', fetcher, { refreshInterval: 30000 });

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          Centro de Aprendizaje
        </h1>
        <p className="text-zinc-500 font-medium">Memoria cognitiva y evolución de la IA</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Base de Conocimiento</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{lessons?.length || 0}</p>
                <p className="text-blue-500 text-xs font-mono">Lecciones</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <History className="text-blue-500" size={20} />
            <span>Registro de Conocimiento Real</span>
          </h2>

          <div className="space-y-4">
            {lessons?.map((lesson: any, i: number) => (
              <motion.div 
                key={lesson.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all group"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                    <Brain size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${lesson.tipo === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {lesson.tipo}
                        </span>
                        <span className="text-zinc-400 font-bold text-xs">{lesson.ticker}</span>
                      </div>
                      <span className="text-zinc-600 text-[10px] font-mono">{new Date(lesson.fecha).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-blue-400 transition-colors">{lesson.titulo}</h3>
                    <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{lesson.leccion}</p>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-1 text-zinc-500 text-xs">
                        <Tag size={12} />
                        <span>{lesson.patron}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )) || <p className="text-zinc-600 italic text-center py-20">La IA aún no ha generado lecciones de trading.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
