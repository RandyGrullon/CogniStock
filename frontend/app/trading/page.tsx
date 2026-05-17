"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LineChart, Wallet, Activity, History, Trash2, Loader2, Search, X, 
  Brain, CheckCircle2, XCircle, Zap, Shield, TrendingUp, TrendingDown,
  Target, BarChart3, Clock, Cpu, Scan, Globe, ChevronRight, AlertCircle,
  Settings, Maximize2, Layers, Workflow, Info, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import TradingChart from '@/components/TradingChart';
import useSWR, { useSWRConfig } from 'swr';
import { useLivePrice, useLivePrices } from '@/hooks/useLivePrice';
import { toJpeg } from 'html-to-image';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { isMarketOpen } from '@/lib/marketHours';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TradingPage() {
  const { mutate } = useSWRConfig();
  const [selectedTicker, setSelectedTicker] = useState('XAUUSD');
  const [tickerInput, setTickerInput] = useState('XAUUSD');
  const [showSearch, setShowSearch] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [timeframe, setTimeframe] = useState('1d');
  
  const [aiState, setAiState] = useState<{
    thought: string;
    confidence: number;
    recommendation: string;
    isAnalyzing: boolean;
  }>({
    thought: "Esperando inicialización de enlace neural...",
    confidence: 0,
    recommendation: "STANDBY",
    isAnalyzing: false
  });

  const [nextScanIn, setNextScanIn] = useState(30 * 60);
  const previousPriceRef = useRef<number | null>(null);
  const isAnalyzingRef = useRef(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isAnalyzingRef.current = aiState.isAnalyzing;
  }, [aiState.isAnalyzing]);

  const handleAiVision = async () => {
    if (aiState.isAnalyzing) return;
    setAiState(prev => ({ ...prev, isAnalyzing: true }));
    setMessage({ text: '', type: '' });
    try {
      let imageBase64 = undefined;
      if (chartContainerRef.current) {
        try {
          await new Promise(r => setTimeout(r, 500));
          imageBase64 = await toJpeg(chartContainerRef.current, { quality: 0.8, backgroundColor: '#09090b' });
        } catch (e) {
          console.warn("No se pudo capturar el gráfico", e);
        }
      }

      const response = await fetch('/api/portfolio/ai-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: selectedTicker, image: imageBase64 })
      });
      const data = await response.json();
      
      if (response.ok) {
        setAiState({
          thought: data.thought,
          confidence: data.confidence,
          recommendation: data.recommendation,
          isAnalyzing: false
        });
        if (data.action !== "WATCHING") {
          setMessage({ text: `Protocolo ejecutado: ${data.action} ${selectedTicker}`, type: 'success' });
          mutate('/api/portfolio/status');
          mutate('/api/portfolio/trades');
        }
      } else {
        setAiState(prev => ({ ...prev, isAnalyzing: false }));
        setMessage({ text: `Neural Error: ${data.error || 'Falla de enlace'}`, type: 'error' });
      }
    } catch (error) {
      setAiState(prev => ({ ...prev, isAnalyzing: false }));
      setMessage({ text: 'Desconexión del motor de inteligencia', type: 'error' });
    }
  };

  // Timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      setNextScanIn((prev) => {
        if (prev <= 1) {
          if (!isAnalyzingRef.current) handleAiVision();
          return 30 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedTicker]);

  const { data: status } = useSWR('/api/portfolio/status', fetcher, { refreshInterval: 5000 });
  const { data: trades } = useSWR('/api/portfolio/trades', fetcher, { refreshInterval: 5000 });
  const openTrades = useMemo(() => trades?.filter((t: any) => t.estado === 'OPEN') || [], [trades]);

  const { data: searchResults } = useSWR(
    tickerInput.length >= 2 ? `/api/market/search?q=${tickerInput}` : null,
    fetcher
  );
  const searchTickers = Array.isArray(searchResults) ? searchResults.map((r: any) => r.symbol) : [];
  const searchPrices = useLivePrices(searchTickers);

  const liveTick = useLivePrice(selectedTicker);
  const { data: tickerData } = useSWR(
    selectedTicker && !liveTick ? `/api/market/ticker/${selectedTicker}` : null,
    fetcher,
    { refreshInterval: 2000 }
  );
  const displayPrice = liveTick?.price ?? tickerData?.price;

  // Volatility detection
  useEffect(() => {
    if (displayPrice && previousPriceRef.current) {
      const change = Math.abs(displayPrice - previousPriceRef.current) / previousPriceRef.current;
      if (change > 0.003 && !isAnalyzingRef.current) {
        handleAiVision();
      }
    }
    previousPriceRef.current = displayPrice;
  }, [displayPrice]);

  const handleCloseTrade = async (tradeId: string) => {
    try {
      const response = await fetch(`/api/portfolio/trades/${tradeId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reasoning: 'Liquidación manual desde terminal institucional' })
      });
      if (response.ok) {
        mutate('/api/portfolio/status');
        mutate('/api/portfolio/trades');
      }
    } catch (e) { console.error(e); }
  };

  const selectAsset = (symbol: string) => {
    setSelectedTicker(symbol);
    setTickerInput(symbol);
    setShowSearch(false);
  };

  return (
    <main className="flex-1 p-6 space-y-6 overflow-y-auto bg-[#050505] text-zinc-300 selection:bg-blue-500/30 selection:text-white">
      
      {/* Institutional Top Bar (HUD) */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-blue-500"></span>
              </div>
              <span className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] md:tracking-[0.4em]">CogniStock Console</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white uppercase italic leading-none">
              Terminal
            </h1>
          </div>
          
          <div className="hidden md:flex h-10 w-px bg-white/5 mx-1" />
          
          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-4 md:gap-8">
             <div className="space-y-0.5 md:space-y-1">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">Equity</span>
                <p className="text-xs md:text-xl font-mono font-black text-white leading-none">${status?.capital_total?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '---'}</p>
             </div>
             <div className="space-y-0.5 md:space-y-1">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">Alpha</span>
                <p className={`text-xs md:text-xl font-mono font-black leading-none ${openTrades.reduce((a,b)=>a+b.pnl,0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                   ${openTrades.reduce((a,b)=>a+b.pnl,0).toFixed(1)}
                </p>
             </div>
             <div className="hidden sm:block space-y-1">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">Load</span>
                <div className="flex gap-0.5 mt-1">
                   {[1,2,3,4].map(i => <div key={i} className={`h-1 w-2 rounded-sm ${i <= 3 ? 'bg-blue-500' : 'bg-zinc-800'}`} />)}
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto lg:ml-0">
          <div className="px-4 md:px-6 py-2 md:py-3 bg-zinc-900/60 border border-white/10 rounded-xl md:rounded-2xl flex flex-col items-end shadow-2xl">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Settlement</span>
            <span className="text-white font-mono font-black text-sm md:text-lg">
              ${status?.capital_disponible?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '---'}
            </span>
          </div>
          <button className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white transition-all"><Settings size={18}/></button>
        </div>
      </header>

      {/* Main Command View */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full items-start">
        
        {/* CENTER COLUMN: Analysis & Visualization (Cols: 8) */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Main Chart Panel */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden relative group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.02] via-transparent to-transparent pointer-events-none" />
            
            <div className="p-8 relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.8rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-105 transition-transform duration-500">
                    <BarChart3 size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-4">
                      <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{selectedTicker}</h2>
                      <MarketStatusBadge ticker={selectedTicker} />
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="bg-emerald-500/10 px-4 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-2xl font-mono text-emerald-400 font-black tracking-tighter leading-none">
                          ${displayPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Globe size={12} className="text-blue-500" /> REAL-TIME NEURAL SYNC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Asset Search Advanced */}
                <div className="relative w-full lg:w-80" ref={searchRef}>
                  <div className="flex items-center gap-3 bg-black/60 border border-white/10 rounded-2xl px-5 py-4 focus-within:border-blue-500/50 transition-all shadow-[0_0_30px_rgba(0,0,0,0.4)] group/search">
                    <Search size={20} className="text-zinc-500 group-focus-within/search:text-blue-500 transition-colors" />
                    <input 
                      type="text" 
                      value={tickerInput}
                      onChange={(e) => { setTickerInput(e.target.value); setShowSearch(true); }}
                      onFocus={() => setShowSearch(true)}
                      className="bg-transparent border-none focus:ring-0 text-base font-black text-white w-full uppercase placeholder:text-zinc-800 tracking-wider"
                      placeholder="SCAN ASSET..."
                    />
                    <AnimatePresence>
                       {tickerInput.length > 0 && (
                          <button onClick={()=>setTickerInput('')} className="text-zinc-600 hover:text-white"><X size={14}/></button>
                       )}
                    </AnimatePresence>
                  </div>
                  
                  <AnimatePresence>
                    {showSearch && searchResults && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.98 }}
                        className="absolute top-full mt-4 left-0 right-0 bg-[#0f0f0f]/95 border border-white/10 rounded-[2rem] shadow-[0_30px_70px_rgba(0,0,0,0.8)] z-[100] max-h-[450px] overflow-y-auto custom-scrollbar backdrop-blur-3xl p-3"
                      >
                        {searchResults.map((res: any) => (
                          <button key={res.symbol} onClick={() => selectAsset(res.symbol)} className="w-full flex items-center justify-between p-5 hover:bg-blue-600/10 rounded-2xl transition-all border-b border-white/5 last:border-none group/item">
                            <div className="flex items-center gap-5 text-left">
                              <div className="w-12 h-12 rounded-[1rem] bg-zinc-900 border border-white/5 flex items-center justify-center font-black text-zinc-500 text-xs group-hover/item:bg-blue-500/20 group-hover/item:text-blue-400 group-hover/item:border-blue-500/20 transition-all">{res.symbol.slice(0, 3)}</div>
                              <div>
                                <p className="text-base font-black text-white tracking-tight">{res.symbol}</p>
                                <p className="text-[10px] text-zinc-600 font-bold uppercase truncate max-w-[150px] tracking-widest">{res.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono font-black text-white">
                                {searchPrices[res.symbol.toUpperCase()] ? `$${searchPrices[res.symbol.toUpperCase()].price.toLocaleString()}` : '---'}
                              </p>
                              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{res.exch}</span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Chart Visual Engine */}
              <div ref={chartContainerRef} className="h-[550px] rounded-[2.5rem] border border-white/[0.05] bg-black/40 shadow-inner relative overflow-hidden group/chart">
                <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover/chart:opacity-100 transition-opacity">
                   <button className="p-2 bg-black/60 border border-white/10 rounded-xl text-zinc-500 hover:text-white"><Maximize2 size={16}/></button>
                   <button className="p-2 bg-black/60 border border-white/10 rounded-xl text-zinc-500 hover:text-white"><Layers size={16}/></button>
                </div>
                <TradingChart 
                  ticker={selectedTicker} 
                  livePrice={displayPrice} 
                  markers={trades || []} 
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                />
              </div>

              {/* Technical Indicator Summary Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                 <TechMetric label="RSI (14)" value="54.2" status="NEUTRAL" />
                 <TechMetric label="MACD" value="BULLISH" status="POSITIVE" />
                 <TechMetric label="EMA 20/50" value="CROSS" status="WARNING" />
                 <TechMetric label="VOLATILITY" value="LOW" status="POSITIVE" />
              </div>
            </div>
          </div>

          {/* Institutional Exposure Table (Operational Ledger) */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
             {/* Dynamic background effect */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-blue-500/20 opacity-30" />
             
             <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between bg-white/[0.01] gap-6">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner shrink-0"><Scan size={24} /></div>
                   <div>
                      <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight leading-none">Operational Ledger</h3>
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live Portfolio Synchronization
                      </p>
                   </div>
                </div>
                
                <div className="flex items-center gap-4 md:gap-8 bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner">
                   <div className="text-right">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Exposure</span>
                      <span className="text-sm font-mono font-black text-white">{openTrades.reduce((a,b)=>a+b.acciones,0)} <span className="text-[10px] text-zinc-500 font-bold">UNITS</span></span>
                   </div>
                   <div className="w-px h-8 bg-white/5" />
                   <div className="text-right">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Total Alpha</span>
                      <span className={`text-sm font-mono font-black ${openTrades.reduce((a,b)=>a+b.pnl,0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${openTrades.reduce((a,b)=>a+b.pnl,0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                   </div>
                </div>
             </div>

             <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left min-w-[800px]">
                 <thead>
                   <tr className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] bg-white/[0.02] border-b border-white/5">
                     <th className="px-8 py-4">Instrument / Strategy</th>
                     <th className="px-8 py-4 text-center">Entry Matrix</th>
                     <th className="px-8 py-4 text-center">Market Valuation</th>
                     <th className="px-8 py-4 text-center">Open Duration</th>
                     <th className="px-8 py-4 text-right">Performance Alpha</th>
                     <th className="px-8 py-4 text-center w-20">LQD</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {openTrades.length > 0 ? openTrades.map((t: any) => {
                     const isPos = t.pnl >= 0;
                     const openDate = new Date(t.fecha_entrada);
                     const diffMs = Date.now() - openDate.getTime();
                     const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                     const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);

                     return (
                       <tr key={t.id} className="group hover:bg-blue-600/[0.03] transition-all">
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all group-hover:scale-105 ${t.tipo === 'BUY' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                                <p className="font-black text-xs">{t.ticker.slice(0, 3)}</p>
                             </div>
                             <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-white text-base tracking-tighter uppercase">{t.ticker}</span>
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm ${t.tipo === 'BUY' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{t.tipo}</span>
                                </div>
                                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{t.acciones} Contracts @ Node-ID: {t.id.slice(0, 8)}</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-8 py-6 text-center">
                            <div className="space-y-1">
                               <p className="text-xs font-mono font-black text-zinc-400">${t.precio_entrada?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                               <div className="h-0.5 w-12 bg-white/5 mx-auto rounded-full" />
                               <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest font-mono">Cost Basis</p>
                            </div>
                         </td>
                         <td className="px-8 py-6 text-center">
                            <div className="space-y-1">
                               <p className={`text-xs font-mono font-black ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>${t.precio_actual?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                               <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-1">
                                  <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" /> Streaming
                               </p>
                            </div>
                         </td>
                         <td className="px-8 py-6 text-center">
                            <div className="flex flex-col items-center">
                               <Clock size={12} className="text-zinc-700 mb-1" />
                               <p className="text-[10px] font-mono font-bold text-zinc-400">{diffHours}h {diffMins}m</p>
                            </div>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <div className={`text-xl font-mono font-black flex items-center justify-end ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                               <div className="flex flex-col items-end mr-3">
                                  <span className="text-[10px] opacity-60">ALPHA</span>
                                  <div className="flex items-center">
                                     {isPos ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                     <span>{isPos?'+':''}{t.pnl_porcentaje?.toFixed(2)}%</span>
                                  </div>
                               </div>
                            </div>
                            <p className={`text-[10px] font-mono font-black mt-1 ${isPos ? 'text-emerald-500/50' : 'text-red-500/50'}`}>
                               NET: {isPos?'+':''}${t.pnl?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                         </td>
                         <td className="px-8 py-6 text-center">
                            <button 
                               onClick={() => handleCloseTrade(t.id)} 
                               className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 transition-all hover:text-white group/close shadow-lg active:scale-95 border border-red-500/20"
                               title="Force Liquidate"
                            >
                               <X size={18} className="group-hover/close:rotate-90 transition-transform duration-500" />
                            </button>
                         </td>
                       </tr>
                     )
                   }) : (
                     <tr><td colSpan={6} className="px-8 py-28 text-center">
                        <div className="flex flex-col items-center gap-5 opacity-20 group">
                           <div className="p-4 bg-white/5 rounded-full border border-white/5 group-hover:scale-110 transition-transform duration-700">
                             <Layers size={48} className="text-zinc-600" />
                           </div>
                           <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.5em]">No operational exposures detected in current session</p>
                        </div>
                     </td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Neural Intelligence Hub (Cols: 4) */}
        <div className="xl:col-span-4 space-y-6">
           
           {/* Neural Engine Control Panel */}
           <div className="bg-[#0a0a0a] border border-blue-500/20 rounded-[2.8rem] p-8 space-y-10 sticky top-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Cpu size={24} /></div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase">Neural Engine</h3>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-inner">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Armed & Active</span>
                 </div>
              </div>

              {/* Status Display: High Fidelity */}
              <div className="bg-gradient-to-br from-blue-600/[0.08] to-purple-600/[0.08] border border-blue-500/20 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden group/brain">
                 <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/brain:opacity-15 transition-opacity duration-700"><Zap size={60} className="text-blue-400" /></div>
                 
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                          {aiState.isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                          {aiState.isAnalyzing ? 'Decoding Market Dynamics...' : 'Cognitive Synthesis'}
                       </span>
                       <AnimatePresence>
                          {aiState.confidence > 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-end">
                               <span className="text-[11px] font-mono font-black text-white bg-blue-500 px-3 py-1 rounded-xl shadow-lg shadow-blue-500/40">
                                 {aiState.confidence}% CONF
                               </span>
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                    
                    <div className="relative">
                       <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-500/30 rounded-full" />
                       <p className="text-base text-zinc-100 leading-relaxed font-medium italic pl-4 selection:bg-blue-500/50">
                          &quot;{aiState.thought}&quot;
                       </p>
                    </div>
                 </div>

                 {/* Execution Trigger */}
                 <button 
                   onClick={handleAiVision}
                   disabled={aiState.isAnalyzing}
                   className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-[0.25em] rounded-[1.5rem] hover:bg-blue-500 hover:text-white transition-all active:scale-[0.97] shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed group/btn overflow-hidden relative"
                 >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                       {aiState.isAnalyzing ? 'PROCESSING SENSORS...' : 'FORCE NEURAL ANALYSIS'}
                       <Zap size={14} className={aiState.isAnalyzing ? 'animate-bounce' : 'group-hover/btn:animate-pulse'} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                 </button>
              </div>

              {/* Advanced System Metrics */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl group/metric hover:bg-white/[0.04] transition-all">
                    <p className="text-[9px] font-black text-zinc-600 uppercase mb-3 tracking-widest">Neural Stance</p>
                    <div className={`text-2xl font-black font-mono tracking-tighter ${aiState.recommendation === 'BUY' ? 'text-emerald-400' : aiState.recommendation === 'SELL' ? 'text-red-400' : 'text-zinc-500'}`}>
                       {aiState.recommendation}
                    </div>
                 </div>
                 <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl group/metric hover:bg-white/[0.04] transition-all">
                    <p className="text-[9px] font-black text-zinc-600 uppercase mb-3 tracking-widest">Core Precision</p>
                    <div className="text-2xl font-black font-mono text-white tracking-tighter">
                       {(status?.total_trades > 0 ? (status?.trades_ganadores / status?.total_trades) * 100 : 0).toFixed(1)}%
                    </div>
                 </div>
              </div>

              {/* Cognitive Event Ledger */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Cognitive Log</h4>
                    <Link href="/learning" className="text-[8px] font-black text-blue-500 uppercase hover:underline">Full Database ↗</Link>
                 </div>
                 <div className="space-y-4">
                    {trades && trades.length > 0 ? (
                       <div className="bg-black/40 border border-white/5 p-6 rounded-[2rem] space-y-4 shadow-inner relative overflow-hidden group/log">
                          <div className="absolute top-0 right-0 p-3 opacity-0 group-hover/log:opacity-20 transition-opacity"><Activity size={12}/></div>
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{trades[0].ticker} Event</span>
                             </div>
                             <span className="text-[8px] font-mono text-zinc-600 font-bold">{new Date(trades[0].fecha_entrada).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 italic leading-relaxed line-clamp-4 selection:bg-emerald-500/20">
                             &quot;{trades[0].razonamiento}&quot;
                          </p>
                          <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                             <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Protocol: Optimized</span>
                             <div className="flex gap-1">
                                {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-blue-500/40" />)}
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-30">
                          <Scan size={32} className="mx-auto text-zinc-700 mb-4" />
                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Awaiting synaptic trigger...</p>
                       </div>
                    )}
                 </div>
              </div>

              {/* Footer Trust Badges */}
              <div className="pt-4 flex flex-col items-center gap-3">
                 <div className="flex items-center gap-3 px-5 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <Shield size={16} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-[0.2em]">Institutional Asset Protection</span>
                 </div>
                 <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest italic">&quot;Superior decisions through algorithmic clarity&quot;</p>
              </div>
           </div>
        </div>

      </div>
      
      {/* Floating Action Button (Chat) */}
      <AnimatePresence>
        <motion.div 
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-10 right-10 z-[200]"
        >
          <Link href="/chat" className="w-18 h-18 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_15px_50px_rgba(37,99,235,0.6)] hover:scale-110 hover:rotate-12 transition-all group border-4 border-white/10 p-5">
             <Brain size={36} className="group-hover:animate-pulse" />
             <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#050505] flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
             </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Background Neural Ambience (Optional aesthetic layer) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20 z-0">
         <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
         <div className="absolute bottom-1/4 -left-20 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>
    </main>
  );
}

function MarketStatusBadge({ ticker }: { ticker: string }) {
  const [status, setStatus] = useState<{ isOpen: boolean; reason?: string } | null>(null);

  useEffect(() => {
    const check = () => setStatus(isMarketOpen(ticker));
    check();
    const timer = setInterval(check, 60000);
    return () => clearInterval(timer);
  }, [ticker]);

  if (!status) return null;

  return (
    <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-3 shadow-sm ${
      status.isOpen ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-400'
    }`}>
      <div className={`w-2 h-2 rounded-full ${status.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      {status.isOpen ? 'Market: LIVE' : status.reason || 'Market: CLOSED'}
    </div>
  );
}

function TechMetric({ label, value, status }: { label: string, value: string, status: 'POSITIVE'|'NEUTRAL'|'WARNING' }) {
  const colors = {
    POSITIVE: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    NEUTRAL: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    WARNING: 'text-amber-400 border-amber-500/20 bg-amber-500/5'
  };
  return (
    <div className={`p-4 rounded-2xl border ${colors[status]} flex flex-col gap-1 shadow-inner group hover:scale-105 transition-transform`}>
       <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</span>
       <span className="text-sm font-black tracking-tight">{value}</span>
    </div>
  );
}
