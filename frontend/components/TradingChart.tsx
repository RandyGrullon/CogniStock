"use client";

import React, { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
} from 'lightweight-charts';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export interface TradingChartProps {
  ticker: string;
  markers?: any[];
  livePrice?: number;
}

export default function TradingChart({ ticker, markers = [], livePrice }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLineRef = useRef<any>(null);

  const { data: chartData, error } = useSWR(`/api/analysis/chart/${ticker}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    
    const chart = createChart(container, {
      width: container.clientWidth || 600,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#71717a',
        fontSize: 12,
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.02)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        autoScale: true,
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        timeVisible: true,
      },
    });

    // Use a very safe way to add the series
    const series = (chart as any).addCandlestickSeries ? 
                   (chart as any).addCandlestickSeries({
                      upColor: '#10b981',
                      downColor: '#ef4444',
                      borderVisible: false,
                      wickUpColor: '#10b981',
                      wickDownColor: '#ef4444',
                   }) : 
                   chart.addSeries(CandlestickSeries, {
                      upColor: '#10b981',
                      downColor: '#ef4444',
                      borderVisible: false,
                      wickUpColor: '#10b981',
                      wickDownColor: '#ef4444',
                   });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (container && chart) {
        chart.applyOptions({ width: container.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      try {
        chart.remove();
      } catch (e) {}
      chartRef.current = null;
      seriesRef.current = null;
      priceLineRef.current = null;
    };
  }, []);

  // Sync data and markers
  useEffect(() => {
    const series = seriesRef.current as any;
    if (series && chartData && Array.isArray(chartData)) {
      try {
        series.setData(chartData);
        
        // Only attempt to set markers if the function exists and we have markers
        if (markers && markers.length > 0 && typeof series.setMarkers === 'function') {
          const formattedMarkers = markers.map(m => {
            const isTrade = !!m.fecha_entrada;
            const date = isTrade ? m.fecha_entrada : m.fecha;
            if (!date) return null;
            
            // Format time correctly for lightweight-charts
            let timeValue: number;
            try {
              timeValue = Math.floor(new Date(date).getTime() / 1000);
            } catch (e) {
              return null;
            }

            // Verify time exists in data to avoid library issues
            const exists = chartData.some(d => d.time === timeValue || (typeof d.time === 'string' && d.time.includes(date.split('T')[0])));
            if (!exists) return null;

            return {
              time: timeValue,
              position: isTrade ? 'belowBar' : (m.recomendacion === 'BUY' ? 'belowBar' : 'aboveBar'),
              color: (isTrade || m.recomendacion === 'BUY') ? '#10b981' : '#3b82f6',
              shape: (isTrade || m.recomendacion === 'BUY') ? 'arrowUp' : 'arrowDown',
              text: isTrade ? `BUY @ $${m.precio_entrada}` : m.recomendacion,
            };
          }).filter(Boolean);

          if (formattedMarkers.length > 0) {
            series.setMarkers(formattedMarkers);
          }
        }
      } catch (e) {
        console.error("Chart sync error:", e);
      }
    }
  }, [chartData, markers]);

  // Live Price update - separate to minimize logic
  useEffect(() => {
    const series = seriesRef.current as any;
    if (series && livePrice && typeof series.createPriceLine === 'function') {
      try {
        if (!priceLineRef.current) {
          priceLineRef.current = series.createPriceLine({
            price: livePrice,
            color: '#3b82f6',
            lineWidth: 2,
            title: 'LIVE',
          });
        } else {
          priceLineRef.current.applyOptions({ price: livePrice });
        }
      } catch (e) {}
    }
  }, [livePrice]);

  return (
    <div className="w-full bg-black/40 p-4 rounded-3xl border border-white/5 relative min-h-[440px]">
      {!chartData && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-10 bg-black/20 backdrop-blur-sm rounded-3xl">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Sincronizando {ticker}...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 z-10 bg-red-500/5 rounded-3xl px-10 text-center">
          <p className="text-xs text-red-400 font-mono">Error de conexión con el mercado</p>
          <p className="text-[10px] text-red-500/60 font-mono">{error.message || "Yahoo 429 / Rate Limit"}</p>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
}
