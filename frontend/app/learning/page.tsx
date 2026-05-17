"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Cpu,
  Scan,
  ChevronRight,
  Filter,
  Layers,
  ShieldCheck,
  Search,
  BookOpen,
  LineChart,
  Activity,
  Workflow
} from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LearningPage() {
  const { data: summaries, isLoading: loadingSummaries } = useSWR("/api/learning/daily-summaries", fetcher, {
    refreshInterval: 10000,
  });
  const { data: lessons, isLoading: loadingLessons } = useSWR("/api/learning/lessons", fetcher, {
    refreshInterval: 30000,
  });
  const { data: preActions, isLoading: loadingPre } = useSWR("/api/learning/pre-action?limit=20", fetcher, {
    refreshInterval: 15000,
  });
  const { data: postActions, isLoading: loadingPost } = useSWR("/api/learning/post-action?limit=20", fetcher, {
    refreshInterval: 15000,
  });

  const [selectedTicker, setSelectedTicker] = useState<string>("GLOBAL");
  const [activeTab, setActiveTab] = useState<'COGNITIVE' | 'STRATEGIC' | 'MEMORY'>('COGNITIVE');

  // Extract all tickers present in the data
  const availableTickers = useMemo(() => {
    const tickers = new Set<string>();
    if (Array.isArray(preActions)) preActions.forEach(pa => tickers.add(pa.ticker));
    if (Array.isArray(postActions)) postActions.forEach(pa => tickers.add(pa.ticker));
    if (Array.isArray(lessons)) lessons.forEach(l => tickers.add(l.ticker));
    return Array.from(tickers).sort();
  }, [preActions, postActions, lessons]);

  // Filtering Logic
  const filteredPre = useMemo(() => 
    selectedTicker === "GLOBAL" ? preActions : preActions?.filter((pa: any) => pa.ticker === selectedTicker)
  , [preActions, selectedTicker]);

  const filteredPost = useMemo(() => 
    selectedTicker === "GLOBAL" ? postActions : postActions?.filter((pa: any) => pa.ticker === selectedTicker)
  , [postActions, selectedTicker]);

  const filteredLessons = useMemo(() => 
    selectedTicker === "GLOBAL" ? lessons : lessons?.filter((l: any) => l.ticker === selectedTicker)
  , [lessons, selectedTicker]);

  return (
    <main className="flex-1 p-6 space-y-8 overflow-y-auto bg-[#050505] text-zinc-300">
      {/* Header Elite */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Cognitive Development Unit</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white flex items-center gap-4 uppercase italic">
            Neural Evolution
          </h1>
          <p className="text-zinc-500 font-medium max-w-xl leading-relaxed">
            Explora la bitácora de aprendizaje de CogniStock. Desde planes pre-ejecución hasta reflexiones post-trade y memoria semántica a largo plazo.
          </p>
        </div>

        {/* Ticker Filter Selector */}
        <div className="flex flex-col gap-2">
           <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Asset Isolation</span>
           <div className="flex items-center gap-2 bg-zinc-900/40 border border-white/5 p-1 rounded-2xl">
              <button 
                onClick={() => setSelectedTicker("GLOBAL")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTicker === 'GLOBAL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-white'}`}
              >
                Global
              </button>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex gap-1 overflow-x-auto max-w-[300px] custom-scrollbar pb-0.5">
                {availableTickers.map(t => (
                  <button 
                    key={t}
                    onClick={() => setSelectedTicker(t)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedTicker === t ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
           </div>
        </div>
      </header>

      {/* KPI Stats Elite */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard 
            label="Neural Lessons" 
            value={lessons?.length || 0} 
            icon={<Brain size={18} className="text-blue-500" />} 
            subValue="Knowledge Base"
            trend="Growing"
         />
         <StatCard 
            label="Pre-Action Logs" 
            value={preActions?.length || 0} 
            icon={<TimerReset size={18} className="text-amber-500" />} 
            subValue="Strategic Intent"
            trend="Active"
         />
         <StatCard 
            label="Reflections" 
            value={postActions?.length || 0} 
            icon={<LightbulbIcon size={18} className="text-emerald-500" />} 
            subValue="Post-Trade Analysis"
            trend="Learning"
         />
         <StatCard 
            label="System Maturity" 
            value="Alpha 2.4" 
            icon={<Cpu size={18} className="text-purple-500" />} 
            subValue="CogniStock Core"
            trend="Optimized"
         />
      </section>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-white/5 gap-8">
        <button onClick={() => setActiveTab('COGNITIVE')} className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'COGNITIVE' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
          Cognitive Feed
          {activeTab === 'COGNITIVE' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
        <button onClick={() => setActiveTab('STRATEGIC')} className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'STRATEGIC' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
          Strategic Ledger
          {activeTab === 'STRATEGIC' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
        <button onClick={() => setActiveTab('MEMORY')} className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'MEMORY' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
          Neural Memory
          {activeTab === 'MEMORY' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
      </div>

      <div className="min-h-[600px]">
        <AnimatePresence mode="wait">
          
          {/* Tab: Cognitive Feed (Pre & Post Actions) */}
          {activeTab === 'COGNITIVE' && (
            <motion.div 
              key="cognitive"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 xl:grid-cols-2 gap-8"
            >
               {/* Pre-Actions */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <Workflow size={20} className="text-blue-500" />
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Predictive Intent</h2>
                  </div>
                  <div className="space-y-4">
                    {loadingPre ? Array(3).fill(0).map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-[2rem] animate-pulse" />) :
                     filteredPre && filteredPre.length > 0 ? filteredPre.map((pa: any, i: number) => (
                       <PreActionElite key={pa.id} pa={pa} index={i} />
                     )) : <EmptyState text={`No pre-action logs for ${selectedTicker}`} />}
                  </div>
               </div>

               {/* Post-Actions */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <History size={20} className="text-emerald-500" />
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Reflective Analysis</h2>
                  </div>
                  <div className="space-y-4">
                    {loadingPost ? Array(3).fill(0).map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-[2rem] animate-pulse" />) :
                     filteredPost && filteredPost.length > 0 ? filteredPost.map((p: any, i: number) => (
                       <PostActionElite key={p.id} post={p} index={i} />
                     )) : <EmptyState text={`No reflection logs for ${selectedTicker}`} />}
                  </div>
               </div>
            </motion.div>
          )}

          {/* Tab: Strategic Ledger (Daily Summaries) */}
          {activeTab === 'STRATEGIC' && (
            <motion.div 
              key="strategic"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-3 px-2">
                <BookOpen size={20} className="text-purple-500" />
                <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Executive Daily Ledger</h2>
              </div>
              {loadingSummaries ? Array(2).fill(0).map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-[2.5rem] animate-pulse" />) :
               summaries && summaries.length > 0 ? summaries.map((s: any, i: number) => (
                <DailySummaryElite key={s.id} summary={s} index={i} />
              )) : <EmptyState text="No strategic logs recorded yet." />}
            </motion.div>
          )}

          {/* Tab: Neural Memory (Long Term Lessons) */}
          {activeTab === 'MEMORY' && (
            <motion.div 
              key="memory"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
               <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className="text-blue-500" />
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Semantic Knowledge Base</h2>
                 </div>
                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Institutional Grade Memory</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {loadingLessons ? Array(4).fill(0).map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-[2.5rem] animate-pulse" />) :
                  filteredLessons && filteredLessons.length > 0 ? filteredLessons.map((l: any, i: number) => (
                    <LessonElite key={l.id} lesson={l} index={i} />
                  )) : <EmptyState text={`No neural lessons stored for ${selectedTicker}`} />}
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </main>
  );
}

function StatCard({ label, value, icon, subValue, trend }: any) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] flex items-center justify-between group hover:border-blue-500/20 transition-all">
       <div className="space-y-1">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
          <p className="text-3xl font-black text-white font-mono">{value}</p>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{subValue}</p>
       </div>
       <div className="flex flex-col items-end gap-3">
          <div className="p-3 bg-white/5 rounded-2xl text-zinc-400 group-hover:text-blue-500 transition-colors">{icon}</div>
          <span className="text-[8px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 uppercase tracking-widest">{trend}</span>
       </div>
    </div>
  );
}

function PreActionElite({ pa, index }: any) {
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
      className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] space-y-4 hover:border-blue-500/30 transition-all relative overflow-hidden group shadow-xl"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={40} className="text-blue-500" /></div>
      <div className="flex items-center justify-between relative z-10">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 text-xs">{pa.ticker.slice(0,3)}</div>
            <div>
               <h4 className="font-black text-white text-sm tracking-tight">{pa.ticker} Protocol</h4>
               <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{pa.planned_action} Target</span>
            </div>
         </div>
         <div className="text-right">
            <span className="block text-[10px] font-mono font-black text-blue-500">{pa.confidence}% CONF</span>
            <span className="text-[8px] font-bold text-zinc-600 uppercase">{new Date(pa.scheduled_at).toLocaleTimeString()}</span>
         </div>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed italic border-l-2 border-blue-500/20 pl-4 py-1">
        &quot;{pa.rationale}&quot;
      </p>
      <div className="pt-2 flex items-center gap-2">
         <Target size={12} className="text-zinc-600" />
         <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Expectation:</span>
         <span className="text-[9px] font-bold text-zinc-300">{pa.expected_outcome}</span>
      </div>
    </motion.div>
  );
}

function PostActionElite({ post, index }: any) {
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
      className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] space-y-4 hover:border-emerald-500/30 transition-all relative overflow-hidden group shadow-xl"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><LightbulbIcon size={40} className="text-emerald-500" /></div>
      <div className="flex items-center justify-between relative z-10">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center font-black text-emerald-500 text-xs">{post.ticker.slice(0,3)}</div>
            <div>
               <h4 className="font-black text-white text-sm tracking-tight">{post.ticker} Analysis</h4>
               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Executed: {post.executed_action}</span>
            </div>
         </div>
         <span className="text-[8px] font-bold text-zinc-600 uppercase">{new Date(post.ts).toLocaleTimeString()}</span>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed italic border-l-2 border-emerald-500/20 pl-4 py-1">
        &quot;{post.result}&quot;
      </p>
      {post.lessons && (
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
           <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Cognitive takeaway</span>
           <p className="text-[10px] text-emerald-300/80 font-medium">{post.lessons}</p>
        </div>
      )}
    </motion.div>
  );
}

function DailySummaryElite({ summary, index }: any) {
  let goals: string[] = [];
  try {
    goals = JSON.parse(String(summary.objetivos ?? "[]").replace(/'/g, '"'));
    if (!Array.isArray(goals)) goals = [String(goals)];
  } catch {
    goals = summary.objetivos ? [summary.objetivos] : [];
  }
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
       <div className="bg-[#0a0a0a] border border-blue-500/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={100} className="text-blue-500" /></div>
          <div className="flex justify-between items-center relative z-10">
             <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Phase: Initiation</h3>
             <span className="text-[10px] font-mono font-black text-zinc-600 bg-white/5 px-3 py-1 rounded-full">{summary.fecha}</span>
          </div>
          <div className="space-y-6 relative z-10">
             <div>
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-2">Primary Directive</span>
                <p className="text-lg font-medium text-zinc-200 italic leading-snug selection:bg-blue-500/30">&quot;{summary.intencion}&quot;</p>
             </div>
             <div className="grid grid-cols-1 gap-2">
                {goals.map((g, i) => (
                  <div key={i} className="flex items-center gap-3 bg-black/40 border border-white/5 p-3 rounded-2xl">
                     <div className="w-5 h-5 rounded-lg bg-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-500">{i+1}</div>
                     <p className="text-[11px] font-bold text-zinc-400">{g}</p>
                  </div>
                ))}
             </div>
          </div>
       </div>

       <div className={`bg-[#0a0a0a] border rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden transition-all duration-700 ${summary.estado === 'COMPLETED' ? 'border-emerald-500/20' : 'border-zinc-800 opacity-50'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-5"><Target size={100} className="text-emerald-500" /></div>
          <div className="flex justify-between items-center relative z-10">
             <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Phase: Resolution</h3>
             {summary.estado === 'PENDING' && <div className="flex items-center gap-2 text-[9px] font-black text-amber-500 uppercase tracking-widest animate-pulse"><Scan size={12} /> Processing...</div>}
          </div>
          
          {summary.estado === 'COMPLETED' ? (
            <div className="space-y-6 relative z-10">
               <div>
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Achievement Data</span>
                  <p className="text-sm font-medium text-zinc-300 leading-relaxed">{summary.resultado}</p>
               </div>
               <div className="p-5 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Neural Optimization</span>
                  <p className="text-xs font-bold text-emerald-400 leading-relaxed italic">{summary.lecciones}</p>
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
               <Activity size={48} className="text-zinc-700" />
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-4 text-center max-w-[200px]">Awaiting market settlement for final synthesis.</p>
            </div>
          )}
       </div>
    </motion.div>
  );
}

function LessonElite({ lesson, index }: any) {
  const isSuccess = lesson.tipo === "SUCCESS";
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}
      className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:border-blue-500/30 transition-all group shadow-xl relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[100px] opacity-10 transition-opacity group-hover:opacity-20 ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`} />
      
      <div className="flex justify-between items-start relative z-10">
         <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isSuccess ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
               <Brain size={28} />
            </div>
            <div>
               <h3 className="text-xl font-black text-white tracking-tight uppercase group-hover:text-blue-400 transition-colors">{lesson.titulo}</h3>
               <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${isSuccess ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}>{lesson.tipo}</span>
                  <span className="text-[10px] font-mono font-black text-zinc-500 tracking-widest">{lesson.ticker}</span>
               </div>
            </div>
         </div>
         <span className="text-[9px] font-bold text-zinc-600 font-mono uppercase">{new Date(lesson.fecha).toLocaleDateString()}</span>
      </div>

      <p className="text-sm text-zinc-400 leading-relaxed font-medium selection:bg-blue-500/20 italic">
        &quot;{lesson.leccion}&quot;
      </p>

      <div className="pt-6 border-t border-white/5 flex flex-wrap gap-4 relative z-10">
         <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
            <Tag size={12} className="text-blue-500" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{lesson.patron}</span>
         </div>
         <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
            <AlertCircle size={12} className="text-emerald-500" />
            <span className="text-[9px] font-bold text-zinc-500 italic max-w-[200px] truncate">Applies: {lesson.aplicar_cuando}</span>
         </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-white/5 rounded-[3rem] opacity-40">
       <Scan size={48} className="text-zinc-700" />
       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic px-8">{text}</p>
    </div>
  );
}
