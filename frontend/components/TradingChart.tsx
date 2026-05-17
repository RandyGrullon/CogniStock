"use client";

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export interface TradingChartProps {
  ticker: string;
  markers?: any[];
  livePrice?: number;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
}

export default function TradingChart({ ticker, markers = [], livePrice, timeframe = '1d', onTimeframeChange }: TradingChartProps) {
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => setMounted(true), []);

  const { data: chartData, error, isLoading } = useSWR(
    `/api/analysis/chart/${ticker}?range=${timeframe === '1d' ? '3mo' : timeframe === '1h' ? '1mo' : '1d'}&interval=${timeframe}`, 
    fetcher, 
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const TIMEFRAMES = [
    { label: '15M', value: '15m' },
    { label: '1H', value: '1h' },
    { label: '1D', value: '1d' },
  ];

  // Formatear datos para Recharts
  const formattedData = useMemo(() => {
    if (!chartData || !Array.isArray(chartData)) return [];
    return chartData.map(d => {
      const dateObj = typeof d.time === 'number' ? new Date(d.time * 1000) : new Date(d.time);
      // Si el intervalo es menor a un día, mostramos hora
      const dateLabel = (timeframe === '15m' || timeframe === '1h') 
        ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : dateObj.toLocaleDateString();
      
      return {
        ...d,
        date: dateLabel,
        price: d.close
      };
    });
  }, [chartData, timeframe]);

  // Filtrar marcadores relevantes para este ticker (case-insensitive)
  const relevantMarkers = useMemo(() => {
    return markers.filter(m => 
      m.ticker?.toUpperCase() === ticker?.toUpperCase() || !m.ticker
    );
  }, [markers, ticker]);

  if (error) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center bg-zinc-900/20 rounded-3xl border border-red-500/10 p-8 text-center">
        <p className="text-red-400 text-sm font-mono">Error de conexión con el mercado</p>
        <p className="text-[10px] text-red-500/60 mt-2 font-mono">Intentando reconexión automática...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center bg-zinc-900/20 rounded-3xl border border-white/5 space-y-4">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Sincronizando {ticker}...</p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="w-full h-[400px] bg-black/40 p-4 rounded-3xl border border-white/5 flex items-center justify-center">
         <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-black/40 p-4 rounded-3xl border border-white/5 relative">
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => onTimeframeChange?.(tf.value)}
            className={`
              px-3 py-1 rounded-lg text-[10px] font-bold font-mono transition-all
              ${timeframe === tf.value 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}
            `}
          >
            {tf.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="date" 
            hide 
          />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right"
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `$${val.toLocaleString()}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#09090b', 
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#fff'
            }}
            itemStyle={{ color: '#3b82f6' }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            animationDuration={500}
          />
          
          {/* Línea de precio actual */}
          {livePrice && (
            <ReferenceLine 
              y={livePrice} 
              stroke="#10b981" 
              strokeDasharray="3 3"
              label={{ 
                position: 'right', 
                value: `LIVE: $${livePrice.toLocaleString()}`, 
                fill: '#10b981', 
                fontSize: 10,
                fontWeight: 'bold'
              }} 
            />
          )}

          {/* Marcadores de trades y análisis */}
          {relevantMarkers.map((m, i) => {
            const isTrade = !!m.fecha_entrada && m.estado === 'OPEN';
            const isAnalysis = !!m.recomendacion && !isTrade;
            
            // Extraer niveles técnicos del trade o del análisis anidado
            const entryPrice = isTrade ? m.precio_entrada : null;
            const targetPrice = isTrade ? (m.precio_objetivo || m.analisis_tecnico?.precio_objetivo) : (isAnalysis ? m.precio_objetivo : null);
            const stopPrice = isTrade ? (m.stop_loss || m.analisis_tecnico?.stop_loss) : (isAnalysis ? m.stop_loss : null);

            // Determinar etiqueta para el eje X compatible con formattedData
            let entryX: string | null = null;
            if (m.fecha_entrada || m.fecha) {
              const dObj = new Date(m.fecha_entrada || m.fecha);
              entryX = (timeframe === '15m' || timeframe === '1h') 
                ? dObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : dObj.toLocaleDateString();
            }

            return (
              <React.Fragment key={`marker-group-${i}`}>
                {/* Línea Vertical de Tiempo (Entrada/Análisis) */}
                {entryX && formattedData.some(d => d.date === entryX) && (
                   <ReferenceLine 
                    x={entryX} 
                    stroke="rgba(255,255,255,0.15)"
                    strokeDasharray="3 3"
                   />
                )}

                {/* Línea de Entrada (Trade) */}
                {entryPrice && (
                  <ReferenceLine 
                    y={entryPrice} 
                    stroke={m.tipo === 'BUY' ? "#10b981" : "#ef4444"} 
                    strokeWidth={2}
                    strokeDasharray="10 5"
                    label={{ 
                      position: 'insideLeft', 
                      value: `${m.tipo} AT $${entryPrice.toLocaleString()}`, 
                      fill: m.tipo === 'BUY' ? "#10b981" : "#ef4444", 
                      fontSize: 10,
                      fontWeight: 'black',
                      className: "drop-shadow-lg"
                    }} 
                  />
                )}

                {/* Línea de Take Profit */}
                {targetPrice && (
                  <ReferenceLine 
                    y={targetPrice} 
                    stroke="#10b981" 
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    opacity={0.4}
                    label={{ 
                      position: 'insideRight', 
                      value: `TARGET: $${targetPrice.toLocaleString()}`, 
                      fill: "#10b981", 
                      fontSize: 8,
                      fontWeight: 'bold'
                    }} 
                  />
                )}

                {/* Línea de Stop Loss */}
                {stopPrice && (
                  <ReferenceLine 
                    y={stopPrice} 
                    stroke="#ef4444" 
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    opacity={0.4}
                    label={{ 
                      position: 'insideRight', 
                      value: `PROTECTION: $${stopPrice.toLocaleString()}`, 
                      fill: "#ef4444", 
                      fontSize: 8,
                      fontWeight: 'bold'
                    }} 
                  />
                )}

                {/* Marcador de recomendación de IA (no trade) */}
                {isAnalysis && m.recomendacion !== 'WATCH' && (
                   <ReferenceLine 
                    y={formattedData[Math.floor(formattedData.length/2)]?.price} // Un valor dummy o promedio si no hay precio
                    stroke={m.recomendacion === 'BUY' ? "#10b981" : "#ef4444"} 
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    label={{ 
                      position: 'insideBottomLeft', 
                      value: `IA SUGGEST: ${m.recomendacion}`, 
                      fill: m.recomendacion === 'BUY' ? "#10b981" : "#ef4444", 
                      fontSize: 9,
                      fontWeight: 'black'
                    }} 
                  />
                )}
              </React.Fragment>
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
