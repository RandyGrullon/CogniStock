"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  BrainCircuit,
  RefreshCw,
  Clock,
  Copy,
  Check,
  Wallet,
  BarChart3,
  Timer,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

type Msg = { role: "user" | "assistant"; content: string; timestamp: string };

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const messagesRef = useRef<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);
  const sessionStartedAtRef = useRef<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setSessionId(uuidv4());
    
    // Cargar historial perpetuo
    fetch("/api/chat/history")
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          const loaded = data.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            timestamp: new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }));
          setMessages(loaded);
        }
      })
      .catch(err => console.error("Error loading history:", err));
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    sessionStartedAtRef.current = sessionStartedAt;
  }, [sessionStartedAt]);

  // Tick del cronómetro
  useEffect(() => {
    if (!sessionStartedAt) return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [sessionStartedAt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  // Guarda la sesión al salir del page
  useEffect(() => {
    return () => {
      const started = sessionStartedAtRef.current;
      const currentMessages = messagesRef.current;
      if (!started || !sessionId || currentMessages.length === 0) return;
      const historyToSave = currentMessages.map((m) => ({ role: m.role, content: m.content }));
      fetch("/api/chat/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          started_at: started.toISOString(),
          ended_at: new Date().toISOString(),
          history: historyToSave,
        }),
        keepalive: true,
      }).catch((err) => console.error("Error saving session on unmount:", err));
    };
  }, [sessionId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    // Arranca cronómetro en el primer mensaje del usuario
    let started = sessionStartedAt;
    if (!started) {
      started = new Date();
      setSessionStartedAt(started);
    }

    const userMsg: Msg = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          session_id: sessionId,
          started_at: started.toISOString(),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("Fallo en la comunicación con el núcleo.");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (err: any) {
      setError("Error de conexión con el núcleo central.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "ERROR: Se ha perdido la conexión con el núcleo de CogniStock.",
          timestamp: "ERROR",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Sparkles className="text-blue-400 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-zinc-500 bg-clip-text text-transparent">
                CogniChat Neural
              </h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] mt-0.5">
                Llama-3.3 70B Adaptive Link
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          {/* Cronómetro de sesión */}
          <SessionTimer started={sessionStartedAt} elapsed={elapsed} />

          <div className="px-4 py-2 bg-zinc-900/50 border border-white/5 rounded-xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Live Context Sync</span>
          </div>
        </motion.div>
      </header>

      <div className="flex-1 glass-card rounded-[3.5rem] border border-white/5 flex flex-col overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 scroll-smooth custom-scrollbar relative z-10"
        >
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20"
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-600 blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity animate-pulse" />
                  <div className="relative w-32 h-32 bg-zinc-950 rounded-[3rem] border border-white/10 flex items-center justify-center text-blue-500 shadow-2xl rotate-[-5deg] group-hover:rotate-0 transition-transform duration-700">
                    <Bot size={56} className="drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  </div>
                </div>
                <div className="space-y-3 max-w-lg">
                  <h2 className="text-3xl font-black text-white tracking-tighter text-balance">
                    Neural Interface v2.1
                  </h2>
                  <p className="text-zinc-500 text-sm leading-relaxed font-medium px-6">
                    Bienvenido al núcleo de <span className="text-blue-400 font-bold">CogniStock</span>. He sincronizado tu
                    wallet y lecciones pasadas. Escribe un mensaje para iniciar tu sesión.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <QuickCommand text="Reporte de mi Cartera" icon={<Wallet size={14} />} onClick={() => setInput("Genera un reporte ejecutivo de mi cartera actual.")} />
                  <QuickCommand text="Análisis de Mercado" icon={<BarChart3 size={14} />} onClick={() => setInput("¿Cuáles son los tickers con mejores señales hoy?")} />
                  <QuickCommand text="Memoria de Fallos" icon={<BrainCircuit size={14} />} onClick={() => setInput("Revisa mis errores pasados y dime qué debo evitar.")} />
                </div>
              </motion.div>
            ) : (
              messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)
            )}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center border border-blue-400/50 shadow-lg shadow-blue-500/20">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl rounded-tl-none flex items-center gap-2 backdrop-blur-xl">
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-[10px] font-mono text-blue-500 uppercase tracking-widest font-bold">
                      Procesando Datos...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 bg-zinc-950/90 border-t border-white/5 backdrop-blur-2xl relative z-20">
          <form onSubmit={sendMessage} className="relative max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2rem] opacity-20 group-focus-within:opacity-40 transition duration-500 blur-sm" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={sessionStartedAt ? "Continúa la conversación..." : "Escribe 'hola' para iniciar tu sesión..."}
                className="relative w-full bg-zinc-900/80 border border-white/10 rounded-[1.8rem] py-5 pl-8 pr-20 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-zinc-600"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="p-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 text-white rounded-2xl transition-all shadow-xl shadow-blue-500/40 flex items-center justify-center group/btn"
                >
                  <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-3 text-[11px] font-mono text-red-400 text-center">{error}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function SessionTimer({ started, elapsed }: { started: Date | null; elapsed: number }) {
  if (!started) {
    return (
      <div className="px-4 py-2 bg-zinc-900/50 border border-white/5 rounded-xl flex items-center gap-2">
        <Timer size={12} className="text-zinc-600" />
        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          Sesión no iniciada
        </span>
      </div>
    );
  }
  return (
    <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
      <Timer size={12} className="text-blue-400 animate-pulse" />
      <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">
        Sesión activa
      </span>
      <span className="text-xs font-mono text-blue-200 font-black tracking-tighter ml-1">
        {formatDuration(elapsed)}
      </span>
    </div>
  );
}

function ChatMessage({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      let processedLine: any = line;
      processedLine = processedLine.replace(/(\$[A-Z]+|[A-Z]{3,5})/g, (match: string) => `__TICKER__${match}__`);
      processedLine = processedLine.replace(/(\$\d+\.?\d*)/g, (match: string) => `__PRICE__${match}__`);
      return (
        <div key={i} className="mb-2 last:mb-0">
          {processedLine.split("__").map((part: string, j: number) => {
            if (part.startsWith("TICKER"))
              return (
                <span key={j} className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold font-mono text-[13px]">
                  {part.replace("TICKER", "")}
                </span>
              );
            if (part.startsWith("PRICE"))
              return (
                <span key={j} className="text-emerald-400 font-bold font-mono">
                  {part.replace("PRICE", "")}
                </span>
              );
            if (part.includes("**")) {
              return part.split("**").map((bPart, k) =>
                k % 2 === 1 ? (
                  <b key={k} className="text-white font-black">
                    {bPart}
                  </b>
                ) : (
                  bPart
                )
              );
            }
            return part;
          })}
        </div>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex gap-5 max-w-[90%] md:max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className="relative flex-shrink-0 mt-1">
          <div className={`absolute inset-0 blur-lg opacity-40 ${isUser ? "bg-zinc-700" : "bg-blue-600"}`} />
          <div
            className={`relative w-11 h-11 rounded-[1.2rem] flex items-center justify-center border ${
              isUser
                ? "bg-zinc-900 border-white/10 text-zinc-400"
                : "bg-blue-600 border-blue-400/50 text-white shadow-inner shadow-blue-400/20"
            }`}
          >
            {isUser ? <User size={22} /> : <Bot size={22} />}
          </div>
        </div>
        <div className="space-y-2 group flex-1">
          <div
            className={`relative p-6 rounded-[2.2rem] text-[15px] leading-relaxed shadow-2xl transition-all border overflow-hidden ${
              isUser
                ? "bg-blue-600 border-blue-400/30 text-white rounded-tr-none"
                : "bg-zinc-900/80 border-white/10 text-zinc-300 rounded-tl-none backdrop-blur-xl"
            }`}
          >
            {!isUser && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />}
            <div className="relative z-10">{renderContent(msg.content)}</div>
            {!isUser && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-zinc-500 hover:text-white border border-white/5"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>
          <div className={`flex items-center gap-3 px-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${
                isUser ? "text-zinc-600" : "text-blue-500/80"
              }`}
            >
              {isUser ? "Master User" : "CogniStock Intelligence"}
            </span>
            <div className="w-1 h-1 bg-zinc-800 rounded-full" />
            <div className="flex items-center gap-1.5 text-zinc-600">
              <Clock size={10} />
              <span className="text-[10px] font-mono">{msg.timestamp}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickCommand({
  text,
  icon,
  onClick,
}: {
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-6 py-3 bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/10 rounded-[1.2rem] text-xs font-bold text-zinc-400 hover:text-white transition-all group shadow-lg"
    >
      <span className="text-blue-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all">{icon}</span>
      <span>{text}</span>
    </button>
  );
}
