"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  History,
  Tag,
  Zap,
  Target,
  Clock,
  AlertCircle,
  Sparkles,
  LightbulbIcon,
  TimerReset,
  TrendingUp,
} from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LearningPage() {
  const { data: summaries } = useSWR("/api/learning/daily-summaries", fetcher, {
    refreshInterval: 10000,
  });
  const { data: lessons } = useSWR("/api/learning/lessons", fetcher, {
    refreshInterval: 30000,
  });
  const { data: preActions } = useSWR("/api/learning/pre-action?limit=10", fetcher, {
    refreshInterval: 15000,
  });
  const { data: postActions } = useSWR("/api/learning/post-action?limit=10", fetcher, {
    refreshInterval: 15000,
  });

  return (
    <div className="space-y-12 pb-20">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          Evolución & Estrategia
        </h1>
        <p className="text-zinc-500 font-medium">
          Lo que la IA escribe antes de actuar, lo que aprende después, y su memoria a largo plazo.
        </p>
      </header>

      {/* Plan del Día */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold flex items-center space-x-2 text-zinc-300">
          <Zap className="text-yellow-500" size={20} />
          <span>Bitácora Estratégica Diaria</span>
        </h2>
        {Array.isArray(summaries) && summaries.length > 0 ? (
          <div className="space-y-10">
            {summaries.map((summary: any, i: number) => (
              <DailySummary key={summary.id} summary={summary} index={i} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-3xl border border-white/5 text-center space-y-4">
            <Clock className="mx-auto text-zinc-700" size={40} />
            <p className="text-zinc-500 font-medium">
              Aguardando la apertura del mercado para definir estrategia...
            </p>
          </div>
        )}
      </section>

      {/* Plan Inminente y Reflexiones */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 border-t border-white/5 pt-12">
        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center space-x-2 text-zinc-300">
            <TimerReset className="text-blue-500" size={20} />
            <span>Plan Inminente · La IA escribe ANTES de actuar</span>
          </h2>
          <div className="space-y-4">
            {Array.isArray(preActions) && preActions.length > 0 ? (
              preActions.map((pa: any, i: number) => (
                <PreActionCard key={pa.id} preAction={pa} index={i} />
              ))
            ) : (
              <p className="text-zinc-600 italic text-center py-12">
                Sin planes registrados todavía. Esperando el próximo ciclo del scheduler.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center space-x-2 text-zinc-300">
            <LightbulbIcon className="text-amber-400" size={20} />
            <span>Reflexiones · Lo que aprendió DESPUÉS de actuar</span>
          </h2>
          <div className="space-y-4">
            {Array.isArray(postActions) && postActions.length > 0 ? (
              postActions.map((p: any, i: number) => <PostActionCard key={p.id} post={p} index={i} />)
            ) : (
              <p className="text-zinc-600 italic text-center py-12">
                Sin reflexiones todavía. Aparecerán tras la próxima ejecución.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Memoria de Largo Plazo */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 border-t border-white/5 pt-12">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-6 bg-white/5">
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                Base de Conocimiento
              </p>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-bold">{lessons?.length || 0}</p>
                <p className="text-blue-500 text-xs font-mono font-bold tracking-tighter">INSIGHTS</p>
              </div>
            </div>
            <div className="h-[1px] bg-white/10" />
            <p className="text-[10px] text-zinc-500 leading-relaxed italic">
              &quot;Cada error es un patrón detectado, cada acierto una regla reforzada.&quot;
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <History className="text-blue-500" size={20} />
            <span>Memoria de Largo Plazo</span>
          </h2>

          <div className="space-y-4">
            {Array.isArray(lessons) && lessons.length > 0 ? (
              lessons.map((lesson: any, i: number) => (
                <LessonCard key={lesson.id} lesson={lesson} index={i} />
              ))
            ) : (
              <p className="text-zinc-600 italic text-center py-20">
                La IA aún no ha generado lecciones profundas.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DailySummary({ summary, index }: any) {
  let goals: string[] = [];
  try {
    goals = JSON.parse(String(summary.objetivos ?? "[]").replace(/'/g, '"'));
    if (!Array.isArray(goals)) goals = [String(goals)];
  } catch {
    goals = summary.objetivos ? [summary.objetivos] : [];
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="grid grid-cols-1 xl:grid-cols-2 gap-6"
    >
      <div className="glass-card p-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Zap size={80} className="text-blue-500" />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <h3 className="text-xl font-bold flex items-center gap-2 text-blue-400">
            <Zap size={20} />
            Apertura: El Plan
          </h3>
          <span className="text-[10px] font-mono text-zinc-500 bg-black/20 px-2 py-1 rounded">{summary.fecha}</span>
        </div>
        <div className="space-y-6 relative z-10">
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 mb-3 tracking-widest">
              Postura Estratégica
            </p>
            <p className="text-base text-zinc-200 leading-relaxed font-semibold italic">
              &quot;{summary.intencion}&quot;
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 mb-3 tracking-widest">
              Objetivos Operativos
            </p>
            <div className="grid grid-cols-1 gap-3">
              {goals.map((obj: string, i: number) => (
                <div
                  key={i}
                  className="text-xs text-zinc-400 flex items-start gap-3 bg-black/20 p-3 rounded-xl border border-white/5"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="leading-tight font-medium">{obj}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`glass-card p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden ${
          summary.estado === "PENDING"
            ? "border-zinc-800 opacity-60 bg-black/20"
            : "border-emerald-500/20 bg-emerald-500/5 shadow-lg shadow-emerald-500/5"
        }`}
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Target size={80} className="text-emerald-500" />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <h3 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
            <Target size={20} />
            Cierre: El Resultado
          </h3>
          {summary.estado === "PENDING" && (
            <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1 rounded-full border border-white/5">
              <Clock size={12} className="text-zinc-500 animate-spin" />
              <span className="text-[10px] font-bold text-zinc-500 tracking-tighter">AGUARDANDO...</span>
            </div>
          )}
        </div>

        {summary.estado === "COMPLETED" ? (
          <div className="space-y-6 relative z-10 h-full flex flex-col">
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-widest">
                  Hitos Alcanzados
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed font-medium">{summary.resultado}</p>
              </div>
              {summary.obstaculos && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-red-500/50 mb-2 tracking-widest">
                    Obstáculos Detectados
                  </p>
                  <p className="text-xs text-zinc-500 font-medium italic">{summary.obstaculos}</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-[10px] uppercase font-bold text-zinc-500 mb-3 tracking-widest">
                Lección Cognitiva Extraída
              </p>
              <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/10 ring-1 ring-emerald-500/5">
                <p className="text-xs text-emerald-400 leading-relaxed font-bold">{summary.lecciones}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-3 relative z-10">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
              <Clock size={24} className="text-zinc-700" />
            </div>
            <p className="text-xs text-zinc-600 font-medium max-w-[200px]">
              La revisión se generará automáticamente tras el cierre de campana.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PreActionCard({ preAction, index }: any) {
  const conf = preAction.confidence ?? 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-6 rounded-3xl border border-blue-500/10 bg-blue-500/[0.03] hover:border-blue-500/30 transition-all space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles size={16} className="text-blue-400" />
          <span className="font-bold text-blue-300 font-mono">{preAction.ticker}</span>
          <span className="text-[10px] uppercase font-black tracking-widest bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
            {preAction.planned_action}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={12} className="text-blue-400" />
          <span className="text-[10px] font-mono text-blue-300 font-bold">{conf}% conf.</span>
          <span className="text-[10px] font-mono text-zinc-600">
            {new Date(preAction.scheduled_at).toLocaleString()}
          </span>
        </div>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{preAction.rationale}</p>
      {preAction.expected_outcome && (
        <div className="text-xs text-zinc-500 italic border-l-2 border-blue-500/30 pl-3">
          Espera: {preAction.expected_outcome}
        </div>
      )}
    </motion.div>
  );
}

function PostActionCard({ post, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-6 rounded-3xl border border-amber-500/10 bg-amber-500/[0.03] hover:border-amber-500/30 transition-all space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LightbulbIcon size={16} className="text-amber-400" />
          <span className="font-bold text-amber-300 font-mono">{post.ticker}</span>
          <span className="text-[10px] uppercase font-black tracking-widest bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded">
            {post.executed_action}
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-600">
          {new Date(post.ts).toLocaleString()}
        </span>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{post.result}</p>
      {post.lessons && (
        <div className="text-xs text-amber-300/80 italic border-l-2 border-amber-500/30 pl-3 font-medium">
          {post.lessons}
        </div>
      )}
    </motion.div>
  );
}

function LessonCard({ lesson, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-8 rounded-3xl border border-white/5 hover:border-blue-500/20 transition-all group relative overflow-hidden"
    >
      <div className="flex items-start space-x-6 relative z-10">
        <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/10">
          <Brain size={28} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-tighter uppercase ${
                  lesson.tipo === "SUCCESS"
                    ? "bg-emerald-500/20 text-emerald-500"
                    : "bg-red-500/20 text-red-500"
                }`}
              >
                {lesson.tipo}
              </span>
              <span className="text-zinc-500 font-black text-[10px] tracking-widest">{lesson.ticker}</span>
            </div>
            <span className="text-zinc-600 text-[10px] font-mono font-bold">
              {new Date(lesson.fecha).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors tracking-tight">
            {lesson.titulo}
          </h3>
          <p className="text-zinc-400 text-sm mt-3 leading-relaxed font-medium">{lesson.leccion}</p>
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center space-x-2 text-zinc-500 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Tag size={12} className="text-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-tight">{lesson.patron}</span>
            </div>
            {lesson.aplicar_cuando && (
              <div className="flex items-center space-x-2 text-zinc-500 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <AlertCircle size={12} className="text-emerald-500" />
                <span className="text-[10px] font-medium italic truncate max-w-[200px]">
                  {lesson.aplicar_cuando}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
