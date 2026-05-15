"use client";

import React, { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  type Time,
} from 'lightweight-charts';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface TradingChartProps {
  ticker: string;
  markers?: any[];
  livePrice?: number;
}

export default function TradingChart({ ticker, markers = [], livePrice }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLineRef = useRef<{ applyOptions: (o: { price: number }) => void } | null>(null);

  const { data: chartData, error } = useSWR(`/api/analysis/chart/${ticker}`, fetcher);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 600,
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
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: 'rgba(59, 130, 246, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2563eb',
        },
        horzLine: {
          color: 'rgba(59, 130, 246, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2563eb',
        },
      },
      handleScroll: true,
      handleScale: true,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Add a price line for the current price
    priceLineRef.current = candlestickSeries.createPriceLine({
      price: 0,
      color: '#3b82f6',
      lineWidth: 2,
      lineStyle: 0, // Solid
      axisLabelVisible: true,
      title: 'LIVE',
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update live price line when livePrice prop changes
  useEffect(() => {
    if (priceLineRef.current && livePrice) {
      priceLineRef.current.applyOptions({
        price: livePrice,
      });
    }
  }, [livePrice]);

  useEffect(() => {
    if (chartData && Array.isArray(chartData) && candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(chartData);
      
      // Map markers to lightweight-charts format
      if (markers && markers.length > 0) {
        const formattedMarkers: any[] = [];
        
        markers.forEach(m => {
          // Handle Analysis objects
          if (m.fecha && !m.fecha_entrada) {
            const dateStr = m.fecha.split('T')[0];
            formattedMarkers.push({
              time: dateStr,
              position: m.recomendacion === 'BUY' ? 'belowBar' : 'aboveBar',
              color: m.recomendacion === 'BUY' ? '#10b981' : '#3b82f6',
              shape: m.recomendacion === 'BUY' ? 'arrowUp' : 'arrowDown',
              text: m.recomendacion,
            });
          }
          
          // Handle Trade objects
          if (m.fecha_entrada) {
            const entryDate = m.fecha_entrada.split('T')[0];
            formattedMarkers.push({
              time: entryDate,
              position: 'belowBar',
              color: '#10b981',
              shape: 'arrowUp',
              text: `BUY @ $${m.precio_entrada}`,
            });
            
            if (m.fecha_salida && m.estado === 'CLOSED') {
              const exitDate = m.fecha_salida.split('T')[0];
              const pnlText = m.pnl >= 0 ? `+$${m.pnl.toFixed(2)}` : `-$${Math.abs(m.pnl).toFixed(2)}`;
              formattedMarkers.push({
                time: exitDate,
                position: 'aboveBar',
                color: m.pnl >= 0 ? '#10b981' : '#ef4444',
                shape: 'arrowDown',
                text: `SELL @ $${m.precio_salida} (${pnlText})`,
              });
            }
          }
        });
        
        // Sort markers by time and remove duplicates if any (by time and text)
        const uniqueMarkers = formattedMarkers
          .sort((a, b) => a.time.localeCompare(b.time))
          .filter((marker, index, self) => 
            index === self.findIndex((t) => (
              t.time === marker.time && t.text === marker.text
            ))
          );

        (candlestickSeriesRef.current as any).setMarkers(uniqueMarkers);
      } else {
        (candlestickSeriesRef.current as any).setMarkers([]);
      }
      
      chartRef.current?.timeScale().fitContent();
    }
  }, [chartData, markers]);

  if (error) return <div className="h-[300px] flex items-center justify-center text-red-500 bg-red-500/5 rounded-2xl border border-red-500/10 font-mono text-xs">Error cargando gráfico de {ticker}</div>;
  if (!chartData) return <div className="h-[300px] flex items-center justify-center text-zinc-500 bg-white/5 rounded-2xl animate-pulse font-mono text-xs text-center px-10">Conectando con el mercado para obtener historial de {ticker}...</div>;

  return (
    <div className="w-full bg-black/40 p-4 rounded-3xl border border-white/5">
      <div ref={chartContainerRef} className="w-full h-[400px] min-h-[400px]" />
    </div>
  );
}
