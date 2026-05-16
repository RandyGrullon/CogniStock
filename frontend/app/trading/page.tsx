"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LineChart, ArrowUpCircle, ArrowDownCircle, Wallet, Activity, History, Trash2, Loader2, Search, X, Brain, CheckCircle2, XCircle, Zap } from 'lucide-react';
import TradingChart from '@/components/TradingChart';
import useSWR, { useSWRConfig } from 'swr';
import { useLivePrice, useLivePrices } from '@/hooks/useLivePrice';
import { toJpeg } from 'html-to-image';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TradingPage() {
  const { mutate } = useSWRConfig();
  const [selectedTicker, setSelectedTicker] = useState('XAUUSD');
  const [tickerInput, setTickerInput] = useState('XAUUSD');
  const [showSearch, setShowSearch] = useState(false);
  const [amount, setAmount] = useState(0.01);
  const [reasoning, setReasoning] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [aiState, setAiState] = useState<{
    thought: string;
    confidence: number;
    recommendation: string;
    isAnalyzing: boolean;
  }>({
    thought: "Esperando activación de visión neural...",
    confidence: 0,
    recommendation: "STANDBY",
    isAnalyzing: false
  });

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleAiVision = async () => {
    setAiState(prev => ({ ...prev, isAnalyzing: true }));
    setMessage({ text: '', type: '' });
    try {
      let imageBase64 = undefined;
      if (chartContainerRef.current) {
        try {
          // Breve pausa para asegurar render completo
          await new Promise(r => setTimeout(r, 300));
          // Capturamos el gráfico antes de mandarlo
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
          setMessage({ text: `IA detectó oportunidad y ejecutó ${data.action}`, type: 'success' });
        }
        mutate('/api/portfolio/status');
        mutate('/api/portfolio/trades');
      } else {
        setMessage({ text: `Error en visión neural: ${data.error || 'Desconocido'}`, type: 'error' });
        setAiState(prev => ({ ...prev, isAnalyzing: false }));
      }
    } catch (error) {
      console.error("AI Vision Error:", error);
      setMessage({ text: 'Error al conectar con el motor de visión', type: 'error' });
      setAiState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  // ... (dentro del return, panel derecho)
  const [timeframe, setTimeframe] = useState('1d'); // Nueva temporalidad
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: status } = useSWR('/api/portfolio/status', fetcher, { refreshInterval: 5000 });
  const { data: trades } = useSWR('/api/portfolio/trades', fetcher, { refreshInterval: 5000 });

  // Búsqueda de activos
  const { data: searchResults } = useSWR(
    tickerInput.length >= 2 ? `/api/market/search?q=${tickerInput}` : null,
    fetcher
  );

  // Precios para los resultados de búsqueda
  const searchTickers = Array.isArray(searchResults) ? searchResults.map((r: any) => r.symbol) : [];
  const searchPrices = useLivePrices(searchTickers);

  // WS directo a TradingView -> precio realmente instantaneo
  const liveTick = useLivePrice(selectedTicker);
  // Fallback HTTP por si el WS no engancha al inicio
  const { data: tickerData } = useSWR(
    selectedTicker && !liveTick ? `/api/market/ticker/${selectedTicker}` : null,
    fetcher,
    { refreshInterval: 1500, revalidateOnFocus: true }
  );
  const displayPrice = liveTick?.price ?? tickerData?.price;

  const openTrades = trades?.filter((t: any) => t.estado === 'OPEN') || [];

  // Cerrar búsqueda al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTrade = async (side: 'BUY' | 'SELL') => {
    if (!reasoning) {
      setMessage({ text: 'Por favor, añade un razonamiento para el Log Brain.', type: 'error' });
      return;
    }

    setIsTrading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/portfolio/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: selectedTicker,
          side,
          amount: parseFloat(amount.toString()),
          reasoning: `[Manual Trade] ${reasoning}`
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ text: `Orden de ${side} ejecutada con éxito para ${selectedTicker}`, type: 'success' });
        setReasoning('');
        mutate('/api/portfolio/status');
        mutate('/api/portfolio/trades');
      } else {
        setMessage({ text: result.detail || result.error || 'Error al ejecutar la orden', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error de conexión con el servidor', type: 'error' });
    } finally {
      setIsTrading(false);
    }
  };

  const handleCloseTrade = async (tradeId: string) => {
    try {
      const response = await fetch(`/api/portfolio/trades/${tradeId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reasoning: 'Cierre manual desde terminal de trading' })
      });

      if (response.ok) {
        mutate('/api/portfolio/status');
        mutate('/api/portfolio/trades');
      }
    } catch (error) {
      console.error('Error closing trade:', error);
    }
  };

  const selectAsset = (symbol: string) => {
    setSelectedTicker(symbol);
    setTickerInput(symbol);
    setShowSearch(false);
  };

  return (
    <main className="flex-1 p-6 space-y-6 overflow-y-auto bg-[#050505] text-zinc-300">
      {/* Mensajes de feedback */}
      {message.text && (
        <div className={`p-4 rounded-2xl border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'} flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300`}>
          <div className="flex items-center space-x-3">
            {message.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            <p className="text-xs font-bold font-mono uppercase tracking-widest">{message.text}</p>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })} className="hover:opacity-70 transition-opacity">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ... Stat Cards ... */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Wallet className="text-blue-500" size={20} />} label="Saldo Disponible" value={`$${status?.capital_disponible?.toLocaleString() || '---'}`} subtext="Equity Liquidity" />
        <StatCard icon={<Activity className="text-emerald-500" size={20} />} label="PnL Abierto" value={`$${openTrades.reduce((acc: number, t: any) => acc + (t.pnl || 0), 0).toFixed(2)}`} subtext="Unrealized" />
        <StatCard icon={<History className="text-purple-500" size={20} />} label="Trades Cerrados" value={status?.total_trades || 0} subtext="Total History" />
        <StatCard icon={<LineChart className="text-orange-500" size={20} />} label="Win Rate" value={`${status?.total_trades > 0 ? ((status?.trades_ganadores / status?.total_trades) * 100).toFixed(1) : '0'}%`} subtext="IA Precision" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 relative overflow-visible">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-600/20 p-2 rounded-xl">
                  <LineChart className="text-blue-500" size={24} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-black text-white tracking-tighter">{selectedTicker}</h2>
                    {displayPrice != null && (
                      <div className="flex items-center space-x-2 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-xl font-mono text-emerald-400 font-black">
                          ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mt-1">
                    {liveTick ? "TradingView WS · Tiempo Real" : "Sincronización Neural Activa"}
                  </p>
                </div>
              </div>
              
              <div className="relative" ref={searchRef}>
                <div className="flex items-center space-x-2 bg-black/40 p-1.5 rounded-xl border border-white/5 w-64 focus-within:border-blue-500/50 transition-all">
                  <Search size={16} className="text-zinc-500 ml-2" />
                  <input 
                    type="text" 
                    value={tickerInput}
                    onChange={(e) => {
                      setTickerInput(e.target.value);
                      setShowSearch(true);
                    }}
                    onFocus={() => setShowSearch(true)}
                    className="bg-transparent border-none focus:ring-0 text-sm font-mono flex-1 px-2 text-white"
                    placeholder="Buscar activo..."
                  />
                  {tickerInput && (
                    <button onClick={() => setTickerInput('')} className="p-1 hover:text-white text-zinc-600">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Dropdown de Búsqueda */}
                {showSearch && searchResults && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-[100] max-h-80 overflow-y-auto custom-scrollbar backdrop-blur-xl">
                    {searchResults.length > 0 ? searchResults.map((res: any) => (
                      <button
                        key={res.symbol}
                        onClick={() => selectAsset(res.symbol)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-500">
                            {res.symbol.slice(0, 4)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white font-mono">{res.symbol}</span>
                            <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">{res.name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-emerald-400">
                            {searchPrices[res.symbol.toUpperCase()] 
                              ? `$${searchPrices[res.symbol.toUpperCase()].price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
                              : '---'}
                          </p>
                          <span className="text-[8px] text-zinc-600 uppercase font-bold">{res.exch}</span>
                        </div>
                      </button>
                    )) : (
                      <div className="p-4 text-center text-xs text-zinc-500 font-mono">No se encontraron activos</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div ref={chartContainerRef} className="h-[440px] bg-gradient-to-b from-transparent to-black/20 rounded-2xl p-2 border border-white/[0.02]">
              <TradingChart 
                ticker={selectedTicker} 
                livePrice={displayPrice} 
                markers={trades || []} 
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />
            </div>
          </div>

          {/* Open Positions Table */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="text-blue-500" size={20} />
                <h3 className="font-bold text-white">Posiciones Abiertas</h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20">
                {openTrades.length} Activas
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-mono text-zinc-500 uppercase tracking-wider border-b border-white/5">
                    <th className="px-6 py-4 font-medium">Ticker</th>
                    <th className="px-6 py-4 font-medium">Lotes/Acc</th>
                    <th className="px-6 py-4 font-medium">Entrada</th>
                    <th className="px-6 py-4 font-medium">Actual</th>
                    <th className="px-6 py-4 font-medium">PnL</th>
                    <th className="px-6 py-4 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {openTrades.length > 0 ? openTrades.map((trade: any) => (
                    <tr key={trade.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trade.tipo === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {trade.tipo}
                        </span>
                        <span className="font-bold text-white">{trade.ticker}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{trade.acciones}</td>
                      <td className="px-6 py-4 font-mono text-xs">${trade.precio_entrada?.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono text-xs">${trade.precio_actual?.toLocaleString()}</td>
                      <td className={`px-6 py-4 font-mono text-xs font-bold ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)} ({trade.pnl_porcentaje?.toFixed(2)}%)
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleCloseTrade(trade.id)}
                          className="p-2 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-lg transition-all"
                          title="Cerrar Posición"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs">
                        No hay posiciones abiertas en este momento
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI Autonomy Status Panel */}
        <div className="space-y-6">
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 sticky top-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
              <Brain className="text-blue-500" size={20} />
              <span>Cerebro Autónomo</span>
            </h3>

            <div className="space-y-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${aiState.isAnalyzing ? 'bg-blue-400 animate-ping' : 'bg-emerald-500'}`} />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                      {aiState.isAnalyzing ? 'Procesando Visión...' : 'Visión Neural Activa'}
                    </span>
                  </div>
                  {aiState.confidence > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">
                      Confianza: {aiState.confidence}%
                    </span>
                  )}
                </div>
                
                <div className="min-h-[100px] flex flex-col justify-center">
                  <p className="text-xs text-zinc-300 leading-relaxed italic font-medium">
                    &quot;{aiState.thought}&quot;
                  </p>
                </div>

                <button 
                  onClick={handleAiVision}
                  disabled={aiState.isAnalyzing}
                  className="w-full mt-6 flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                  {aiState.isAnalyzing ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Zap size={14} className="fill-current" />
                      <span>Escanear Gráfico & Operar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1">Postura IA</p>
                  <p className={`text-xs font-mono font-bold ${aiState.recommendation === 'BUY' ? 'text-emerald-400' : aiState.recommendation === 'SELL' ? 'text-red-400' : 'text-zinc-400'}`}>
                    {aiState.recommendation}
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1">Modo de Red</p>
                  <p className="text-xs font-mono font-bold text-blue-400">AUTÓNOMO</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-4">Registro de Consciencia</p>
              {trades && trades.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trades[0].tipo === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {trades[0].tipo} {trades[0].ticker}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-mono">{new Date(trades[0].fecha_entrada).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 italic line-clamp-4 bg-black/20 p-3 rounded-lg border border-white/5">
                    &quot;{trades[0].razonamiento}&quot;
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                  <p className="text-[10px] text-zinc-600 italic">Esperando señal de mercado...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string | number, subtext: string }) {
  return (
    <div className="bg-zinc-900/40 border border-white/5 p-4 lg:p-5 rounded-3xl space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="p-2 bg-white/5 rounded-xl flex-shrink-0">
          {icon}
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter truncate">{subtext}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl lg:text-2xl font-bold text-white tracking-tight truncate">{value}</p>
      </div>
    </div>
  );
}
