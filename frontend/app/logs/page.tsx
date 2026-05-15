"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Search,
  Brain,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  LineChart,
  MessageSquare,
  Activity,
  Zap,
  Clock,
  Sparkles,
  TimerReset,
  TrendingUp,
  Lightbulb,
  Cog,
  CircleDot,
  CheckCircle2,
  XCircle,
  ListChecks,
} from "lucide-react";
import useSWR from "swr";
import TradingChart from "@/components/TradingChart";
import { useLivePrice } from "@/hooks/useLivePrice";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type EventType =
  | "analisis"
  | "trade"
  | "leccion"
  | "daily_summary"
  | "chat_session"
  | "pre_action"
  | "post_action"
  | "cron_run"
  | "tick";

type UnifiedEvent = {
  id: string;
  type: EventType;
  ts: string;
  ticker?: string;
  title: string;
  summary: string;
  raw: any;
};

const TYPE_META: Record<
  EventType,
  { label: string; icon: any; color: string; bg: string; ring: string }
> = {
  analisis: {
    label: "Análisis",
    icon: Brain,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
  },
  trade: {
    label: "Trade",
    icon: Activity,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
  },
  leccion: {
    label: "Lección",
    icon: Lightbulb,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
  },
  daily_summary: {
    label: "Bitácora del día",
    icon: Sparkles,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    ring: "ring-indigo-500/20",
  },
  chat_session: {
    label: "Sesión chat",
    icon: MessageSquare,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    ring: "ring-purple-500/20",
  },
  pre_action: {
    label: "Plan inminente",
    icon: TimerReset,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    ring: "ring-cyan-500/20",
  },
  post_action: {
    label: "Reflexión",
    icon: Brain,
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
  },
  cron_run: {
    label: "Cron",
    icon: Cog,
    color: "text-zinc-300",
    bg: "bg-zinc-500/10",
    ring: "ring-zinc-500/20",
  },
  tick: {
    label: "Tick",
    icon: CircleDot,
    color: "text-emerald-300",
    bg: "bg-emerald-500/5",
    ring: "ring-emerald-500/10",
  },
};

const ALL_TABS: Array<{ key: "all" | EventType; label: string }> = [
  { key: "all", label: "Todo" },
  { key: "analisis", label: "Análisis" },
  { key: "trade", label: "Trades" },
  { key: "chat_session", label: "Sesiones Chat" },
  { key: "pre_action", label: "Pre-Action" },
  { key: "post_action", label: "Post-Action" },
  { key: "leccion", label: "Lecciones" },
  { key: "daily_summary", label: "Bitácora" },
  { key: "cron_run", label: "Cron" },
  { key: "tick", label: "Ticks" },
];

function fmt(value: any): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function shorten(str: string, n = 140): string {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function formatDuration(s: number | null | undefined): string {
  if (!s || s < 0) return "0s";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export default function DecisionLogsPage() {
  const { data: feed, error } = useSWR("/api/logs/feed?limit=50", fetcher, {
    refreshInterval: 5000,
  });
  const [tab, setTab] = useState<"all" | EventType>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const goldTick = useLivePrice("XAUUSD");

  const unified = useMemo<UnifiedEvent[]>(() => {
    if (!feed) return [];
    const events: UnifiedEvent[] = [];

    for (const a of feed.analisis ?? []) {
      // Filtrar análisis que ya están dentro de un trade (mismo ticker y tiempo cercano < 10s)
      const isRedundant = (feed.trades ?? []).some((t: any) => 
        t.ticker === a.ticker && 
        Math.abs(+new Date(t.fecha_entrada) - +new Date(a.fecha)) < 10000
      );
      
      if (isRedundant) continue;

      events.push({
        id: `analisis:${a.id}`,
        type: "analisis",
        ts: a.fecha,
        ticker: a.ticker,
        title: `${a.ticker} → ${a.recomendacion ?? "?"}`,
        summary: `Confianza ${a.confianza ?? 0}% · ${shorten(a.razonamiento ?? "", 110)}`,
        raw: a,
      });
    }
    for (const t of feed.trades ?? []) {
      const closed = t.estado === "CLOSED";
      events.push({
        id: `trade:${t.id}`,
        type: "trade",
        ts: closed && t.fecha_salida ? t.fecha_salida : t.fecha_entrada,
        ticker: t.ticker,
        title: `${closed ? "CLOSE" : "OPEN"} ${t.ticker} · ${t.acciones} @ $${
          closed ? t.precio_salida : t.precio_entrada
        }`,
        summary: closed
          ? `PnL ${t.pnl >= 0 ? "+" : ""}$${(t.pnl ?? 0).toFixed?.(2) ?? t.pnl} (${(t.pnl_porcentaje ?? 0).toFixed?.(2)}%)`
          : shorten(t.razonamiento ?? "Operación abierta", 110),
        raw: t,
      });
    }
    for (const l of feed.lecciones ?? []) {
      events.push({
        id: `lec:${l.id}`,
        type: "leccion",
        ts: l.fecha,
        ticker: l.ticker,
        title: `${l.titulo ?? "Lección"}`,
        summary: shorten(l.leccion ?? "", 130),
        raw: l,
      });
    }
    for (const d of feed.daily_summaries ?? []) {
      events.push({
        id: `daily:${d.id}`,
        type: "daily_summary",
        ts: d.created_at ?? d.fecha,
        title: `Bitácora ${d.fecha} · ${d.estado}`,
        summary: shorten(d.intencion ?? "", 130),
        raw: d,
      });
    }
    for (const c of feed.chat_sessions ?? []) {
      events.push({
        id: `chat:${c.id}`,
        type: "chat_session",
        ts: c.ended_at ?? c.started_at,
        title: `Sesión chat · ${formatDuration(c.duration_seconds)} · ${c.message_count ?? 0} msgs`,
        summary: shorten(c?.summary?.summary ?? "Sin resumen", 130),
        raw: c,
      });
    }
    for (const p of feed.pre_action_logs ?? []) {
      events.push({
        id: `pre:${p.id}`,
        type: "pre_action",
        ts: p.scheduled_at,
        ticker: p.ticker,
        title: `Plan: ${p.planned_action} ${p.ticker}`,
        summary: shorten(p.rationale ?? "", 130),
        raw: p,
      });
    }
    for (const p of feed.post_action_logs ?? []) {
      events.push({
        id: `post:${p.id}`,
        type: "post_action",
        ts: p.ts,
        ticker: p.ticker,
        title: `Reflexión: ${p.executed_action} ${p.ticker}`,
        summary: shorten(p.lessons ?? p.result ?? "", 130),
        raw: p,
      });
    }
    for (const c of feed.cron_runs ?? []) {
      events.push({
        id: `cron:${c.id}`,
        type: "cron_run",
        ts: c.started_at,
        title: `Cron · ${c.job_name} · ${c.status}`,
        summary: c.error ? `ERROR: ${shorten(c.error, 120)}` : shorten(fmt(c.payload), 120),
        raw: c,
      });
    }
    // Mostramos solo los últimos 20 ticks para no saturar.
    const ticks = (feed.market_ticks ?? []).slice(0, 20);
    for (const t of ticks) {
      events.push({
        id: `tick:${t.id}`,
        type: "tick",
        ts: t.ts,
        ticker: t.symbol,
        title: `${t.symbol} $${t.price?.toFixed?.(2) ?? t.price}`,
        summary: `Fuente: ${t.source ?? "?"}`,
        raw: t,
      });
    }
    return events.sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
  }, [feed]);

  const filtered = useMemo(() => {
    let arr = unified;
    if (tab !== "all") arr = arr.filter((e) => e.type === tab);
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          (e.ticker ?? "").toLowerCase().includes(q)
      );
    }
    return arr;
  }, [unified, tab, search]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const tradesToday = (feed?.trades ?? []).filter((t: any) =>
      String(t.fecha_entrada ?? "").startsWith(today)
    ).length;
    const chatSessionsToday = (feed?.chat_sessions ?? []).filter((c: any) =>
      String(c.started_at ?? "").startsWith(today)
    ).length;
    const cronErrors = (feed?.cron_runs ?? []).filter((c: any) => c.status === "ERROR").length;
    const lastTick = (feed?.market_ticks ?? []).find((t: any) => t.symbol === "XAUUSD");
    return { tradesToday, chatSessionsToday, cronErrors, lastTick };
  }, [feed]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Registros de Decisión
          </h1>
          <p className="text-zinc-500 font-medium italic">
            &quot;El rastro completo del pensamiento autónomo de CogniStock&quot;
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Buscar por ticker, texto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 px-10 text-xs focus:outline-none focus:border-blue-500/50 transition-all w-72"
            />
          </div>
        </div>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity size={16} />}
          label="Trades hoy"
          value={stats.tradesToday}
          tone="emerald"
        />
        <StatCard
          icon={<MessageSquare size={16} />}
          label="Sesiones chat hoy"
          value={stats.chatSessionsToday}
          tone="purple"
        />
        <StatCard
          icon={<AlertTriangle size={16} />}
          label="Errores cron"
          value={stats.cronErrors}
          tone={stats.cronErrors > 0 ? "red" : "zinc"}
        />
        <StatCard
          icon={<LineChart size={16} />}
          label="XAUUSD live"
          value={
            goldTick
              ? `$${goldTick.price.toFixed(2)}`
              : stats.lastTick?.price
              ? `$${stats.lastTick.price.toFixed?.(2) ?? stats.lastTick.price}`
              : "—"
          }
          tone={goldTick ? "emerald" : "zinc"}
          subtle={goldTick ? "tick en vivo" : "último tick DB"}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {ALL_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border whitespace-nowrap transition-all ${
              tab === t.key
                ? "bg-blue-500/10 border-blue-500/40 text-blue-300"
                : "bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:border-white/20"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {error && (
          <div className="glass-card p-4 rounded-2xl border border-red-500/20 text-red-400 text-xs font-mono">
            Error cargando logs: {String(error)}
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="glass-card p-16 rounded-3xl border border-white/5 text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Terminal className="text-zinc-700" size={28} />
            </div>
            <p className="text-zinc-500 font-mono text-xs">
              Sin registros para el filtro actual.
            </p>
          </div>
        ) : (
          filtered.map((event, i) => (
            <TimelineRow
              key={event.id}
              event={event}
              expanded={expanded === event.id}
              onToggle={() => setExpanded(expanded === event.id ? null : event.id)}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  subtle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: "emerald" | "purple" | "red" | "zinc";
  subtle?: string;
}) {
  const colors = {
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    purple: "border-purple-500/20 bg-purple-500/5 text-purple-400",
    red: "border-red-500/20 bg-red-500/5 text-red-400",
    zinc: "border-white/5 bg-white/5 text-zinc-400",
  } as const;
  return (
    <div className={`glass-card p-5 rounded-3xl border ${colors[tone].split(" ").slice(0, 2).join(" ")} space-y-3`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl border border-white/5 ${colors[tone].split(" ")[1]} ${colors[tone].split(" ")[2]}`}>
          {icon}
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">{subtle ?? "hoy"}</span>
      </div>
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white tracking-tight font-mono">{value}</p>
      </div>
    </div>
  );
}

function TimelineRow({
  event,
  expanded,
  onToggle,
  index,
}: {
  event: UnifiedEvent;
  expanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const meta = TYPE_META[event.type];
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`glass-card rounded-2xl border transition-all ${
        expanded
          ? `border-white/20 ring-1 ${meta.ring}`
          : "border-white/5 hover:border-white/20"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 text-left"
      >
        <div className={`w-10 h-10 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-0.5 flex-wrap">
            <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} font-black`}>
              {meta.label}
            </span>
            {event.ticker && (
              <span className="text-[10px] font-mono text-zinc-500 font-bold tracking-tighter">
                {event.ticker}
              </span>
            )}
            <span className="text-sm font-bold text-white truncate">{event.title}</span>
          </div>
          <p className="text-xs text-zinc-500 truncate">{event.summary}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-zinc-600">
          <Clock size={12} />
          <span className="font-mono text-[10px] whitespace-nowrap">{new Date(event.ts).toLocaleString()}</span>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-6 bg-black/30">
              <EventDetail event={event} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EventDetail({ event }: { event: UnifiedEvent }) {
  switch (event.type) {
    case "analisis":
      return <AnalysisDetail data={event.raw} />;
    case "trade":
      return <TradeDetail data={event.raw} />;
    case "leccion":
      return <LessonDetail data={event.raw} />;
    case "daily_summary":
      return <DailyDetail data={event.raw} />;
    case "chat_session":
      return <ChatSessionDetail data={event.raw} />;
    case "pre_action":
      return <PreActionDetail data={event.raw} />;
    case "post_action":
      return <PostActionDetail data={event.raw} />;
    case "cron_run":
      return <CronDetail data={event.raw} />;
    case "tick":
      return <TickDetail data={event.raw} />;
    default:
      return <pre className="text-[10px] text-zinc-500 font-mono">{fmt(event.raw)}</pre>;
  }
}

function AnalysisDetail({ data }: any) {
  const riesgos = Array.isArray(data.riesgos)
    ? data.riesgos
    : typeof data.riesgos === "string"
    ? data.riesgos.split(",")
    : [];
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-400">
          <Brain size={16} />
          <h4 className="text-xs font-bold uppercase tracking-widest">Razonamiento</h4>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">{data.razonamiento}</p>
      </div>
      <TradingChart ticker={data.ticker} markers={[data]} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={14} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Riesgos</h4>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {riesgos.map((r: string, i: number) => (
              <div key={i} className="text-xs text-zinc-400 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                {String(r).trim()}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Objetivos</h4>
          <div className="grid grid-cols-1 gap-2 text-xs font-mono">
            <div className="flex justify-between bg-white/5 border border-white/5 rounded-lg px-3 py-2">
              <span className="text-zinc-500">Target</span>
              <span className="text-emerald-400 font-bold">${data.precio_objetivo ?? "—"}</span>
            </div>
            <div className="flex justify-between bg-white/5 border border-white/5 rounded-lg px-3 py-2">
              <span className="text-zinc-500">Stop</span>
              <span className="text-red-400 font-bold">${data.stop_loss ?? "—"}</span>
            </div>
            <div className="flex justify-between bg-white/5 border border-white/5 rounded-lg px-3 py-2">
              <span className="text-zinc-500">Horizonte</span>
              <span className="text-white font-bold uppercase">{data.horizonte ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TradeDetail({ data }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <Field label="Ticker" value={data.ticker} />
        <Field label="Tipo" value={data.tipo} />
        <Field label="Acciones" value={data.acciones} />
        <Field label="Estado" value={data.estado} />
        <Field label="Entrada" value={`$${data.precio_entrada}`} />
        <Field label="Actual" value={`$${data.precio_actual ?? "—"}`} />
        <Field
          label="PnL"
          value={`${data.pnl >= 0 ? "+" : ""}$${(data.pnl ?? 0).toFixed?.(2) ?? data.pnl}`}
          positive={data.pnl >= 0}
        />
        <Field label="PnL %" value={`${(data.pnl_porcentaje ?? 0).toFixed?.(2)}%`} positive={data.pnl >= 0} />
      </div>
      
      <div className="space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Razonamiento de Operación</h4>
        <p className="text-sm text-zinc-300 leading-relaxed">{data.razonamiento}</p>
      </div>

      {data.analisis_tecnico && (
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-blue-400">
            <Brain size={16} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Análisis IA Integrado</h4>
          </div>
          <AnalysisDetail data={data.analisis_tecnico} />
        </div>
      )}
    </div>
  );
}

function LessonDetail({ data }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb size={14} className="text-amber-400" />
        <span className="text-amber-300 font-bold text-sm">{data.titulo}</span>
        <span className="text-[10px] font-mono text-zinc-500">{data.patron}</span>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{data.leccion}</p>
      {data.aplicar_cuando && (
        <p className="text-xs text-zinc-500 italic border-l-2 border-amber-500/30 pl-3">
          Aplicar cuando: {data.aplicar_cuando}
        </p>
      )}
    </div>
  );
}

function DailyDetail({ data }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
      <div className="space-y-2">
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Intención</h4>
        <p className="italic text-zinc-300">&quot;{data.intencion}&quot;</p>
      </div>
      <div className="space-y-2">
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">Resultado</h4>
        <p className="text-zinc-300">{data.resultado || <span className="text-zinc-600">— pendiente —</span>}</p>
      </div>
      {data.lecciones && (
        <div className="md:col-span-2 space-y-2">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-amber-400">Lección del día</h4>
          <p className="text-zinc-300">{data.lecciones}</p>
        </div>
      )}
    </div>
  );
}

function ChatSessionDetail({ data }: any) {
  const transcript = Array.isArray(data.transcript) ? data.transcript : [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <Field label="Duración" value={formatDuration(data.duration_seconds)} />
        <Field label="Mensajes" value={data.message_count ?? transcript.length} />
        <Field label="Inicio" value={new Date(data.started_at).toLocaleString()} />
        <Field label="Fin" value={data.ended_at ? new Date(data.ended_at).toLocaleString() : "—"} />
      </div>
      {data.summary && (
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-purple-400">Resumen IA</h4>
          <p className="text-sm text-zinc-300 leading-relaxed">{data.summary.summary ?? fmt(data.summary)}</p>
          {Array.isArray(data.summary.topics) && (
            <div className="flex flex-wrap gap-2">
              {data.summary.topics.map((t: string) => (
                <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {transcript.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
            Ver transcripción ({transcript.length})
          </summary>
          <div className="mt-3 max-h-60 overflow-y-auto space-y-2 bg-black/40 p-3 rounded-xl border border-white/5">
            {transcript.map((m: any, i: number) => (
              <div key={i} className={m.role === "user" ? "text-zinc-300" : "text-purple-300"}>
                <span className="font-bold mr-2 uppercase text-[10px]">{m.role}:</span>
                {m.content}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function PreActionDetail({ data }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <Field label="Ticker" value={data.ticker} />
        <Field label="Acción planeada" value={data.planned_action} />
        <Field label="Confianza" value={`${data.confidence ?? 0}%`} />
        <Field label="Programado" value={new Date(data.scheduled_at).toLocaleString()} />
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{data.rationale}</p>
      {data.expected_outcome && (
        <p className="text-xs italic text-cyan-300/80 border-l-2 border-cyan-500/30 pl-3">
          Espera: {data.expected_outcome}
        </p>
      )}
      {data.market_snapshot && (
        <details>
          <summary className="cursor-pointer text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
            Snapshot de mercado
          </summary>
          <pre className="text-[10px] font-mono text-zinc-500 mt-2 bg-black/40 p-3 rounded-xl border border-white/5 max-h-40 overflow-auto">
            {JSON.stringify(data.market_snapshot, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function PostActionDetail({ data }: any) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
        <Field label="Ticker" value={data.ticker} />
        <Field label="Acción ejecutada" value={data.executed_action} />
        <Field label="Cuándo" value={new Date(data.ts).toLocaleString()} />
      </div>
      {data.result && <p className="text-sm text-zinc-300 leading-relaxed">{data.result}</p>}
      {data.lessons && (
        <p className="text-xs text-amber-300/80 italic border-l-2 border-amber-500/30 pl-3">
          {data.lessons}
        </p>
      )}
    </div>
  );
}

function CronDetail({ data }: any) {
  const ok = data.status === "SUCCESS";
  return (
    <div className="space-y-3 text-xs font-mono">
      <div className="flex items-center gap-3">
        {ok ? (
          <CheckCircle2 size={16} className="text-emerald-400" />
        ) : data.status === "ERROR" ? (
          <XCircle size={16} className="text-red-400" />
        ) : (
          <ListChecks size={16} className="text-zinc-400" />
        )}
        <span className={`font-bold ${ok ? "text-emerald-400" : data.status === "ERROR" ? "text-red-400" : "text-zinc-300"}`}>
          {data.job_name}
        </span>
        <span className="text-zinc-500">·</span>
        <span className="text-zinc-500">{data.status}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Field label="Inicio" value={new Date(data.started_at).toLocaleString()} />
        <Field label="Fin" value={data.finished_at ? new Date(data.finished_at).toLocaleString() : "—"} />
        <Field label="Estado" value={data.status} positive={ok} />
      </div>
      {data.error && (
        <pre className="text-[10px] text-red-400 bg-red-500/5 p-3 rounded-xl border border-red-500/10 whitespace-pre-wrap">
          {data.error}
        </pre>
      )}
      {data.payload && (
        <details>
          <summary className="cursor-pointer text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
            Payload
          </summary>
          <pre className="text-[10px] text-zinc-500 mt-2 bg-black/40 p-3 rounded-xl border border-white/5 max-h-60 overflow-auto">
            {JSON.stringify(data.payload, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function TickDetail({ data }: any) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
      <Field label="Símbolo" value={data.symbol} />
      <Field label="Precio" value={`$${data.price?.toFixed?.(2) ?? data.price}`} positive />
      <Field label="Fuente" value={data.source} />
      <Field label="Hora" value={new Date(data.ts).toLocaleString()} />
    </div>
  );
}

function Field({
  label,
  value,
  positive,
}: {
  label: string;
  value: any;
  positive?: boolean;
}) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 space-y-0.5">
      <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">{label}</div>
      <div
        className={`font-bold ${
          positive == null ? "text-white" : positive ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}
