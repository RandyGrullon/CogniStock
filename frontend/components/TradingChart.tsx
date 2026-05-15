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
  livePrice?: number;
  trades?: any[];
}

export default function TradingChart({ ticker, livePrice, trades = [] }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLineRef = useRef<{ applyOptions: (o: { price: number }) => void } | null>(null);
  const tradePriceLinesRef = useRef<any[]>([]);

  const { data: chartData, error } = useSWR(`/api/analysis/chart/${ticker}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with a slight delay to ensure container width is calculated correctly by the browser
    const container = chartContainerRef.current;
    const width = container.clientWidth || 600;
    
    const chart = createChart(container, {
      width: width,
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
        mode: 0, // Normal
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

    // Price line for current price
    priceLineRef.current = candlestickSeries.createPriceLine({
      price: 0,
      color: '#3b82f6',
      lineWidth: 2,
      lineStyle: 0,
      axisLabelVisible: true,
      title: 'LIVE',
    });

    const handleResize = () => {
      if (container) {
        chart.applyOptions({ width: container.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      priceLineRef.current = null;
      tradePriceLinesRef.current = [];
    };
  }, []);

  // Sync data
  useEffect(() => {
    if (chartData && Array.isArray(chartData) && candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(chartData);
      
      const series = candlestickSeriesRef.current as any;

      // Clear old price lines
      tradePriceLinesRef.current.forEach(line => {
        try {
          series.removePriceLine(line);
        } catch(e) {}
      });
      tradePriceLinesRef.current = [];
      
      const tickerTrades = trades.filter((t: any) => t.ticker === ticker);
      const newPriceLines: any[] = [];
      const formattedMarkers: any[] = [];

      tickerTrades.forEach((trade: any) => {
        // Markers for execution
        if (trade.fecha_entrada) {
          const entryDateStr = trade.fecha_entrada.split('T')[0];
          formattedMarkers.push({
            time: entryDateStr,
            position: trade.tipo === 'BUY' ? 'belowBar' : 'aboveBar',
            color: trade.tipo === 'BUY' ? '#3b82f6' : '#ef4444',
            shape: trade.tipo === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: `Entry ${trade.tipo} @ ${trade.precio_entrada}`,
          });

          if (trade.estado === 'CLOSED' && trade.fecha_salida) {
            const exitDateStr = trade.fecha_salida.split('T')[0];
            formattedMarkers.push({
              time: exitDateStr,
              position: trade.tipo === 'BUY' ? 'aboveBar' : 'belowBar',
              color: trade.pnl >= 0 ? '#10b981' : '#ef4444',
              shape: trade.tipo === 'BUY' ? 'arrowDown' : 'arrowUp',
              text: `Close @ ${trade.precio_salida} (${trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)})`,
            });
          }
        }

        // Open Position Price Lines
        if (trade.estado === 'OPEN') {
          if (trade.precio_entrada) {
            newPriceLines.push(series.createPriceLine({
              price: trade.precio_entrada,
              color: trade.tipo === 'BUY' ? '#3b82f6' : '#ef4444',
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: true,
              title: `Entry ${trade.tipo}`,
            }));
          }
          if (trade.stop_loss) {
            newPriceLines.push(series.createPriceLine({
              price: trade.stop_loss,
              color: '#ef4444',
              lineWidth: 1,
              lineStyle: 1,
              axisLabelVisible: true,
              title: 'SL',
            }));
          }
          if (trade.take_profit) {
            newPriceLines.push(series.createPriceLine({
              price: trade.take_profit,
              color: '#10b981',
              lineWidth: 1,
              lineStyle: 1,
              axisLabelVisible: true,
              title: 'TP',
            }));
          }
        }
      });

      tradePriceLinesRef.current = newPriceLines;

      // Map strings to timestamps and dedup
      const finalMarkers = formattedMarkers.map(marker => {
          if (typeof marker.time === 'string' && chartData[0] && typeof chartData[0].time === 'number') {
              return { ...marker, time: Math.floor(new Date(marker.time).getTime() / 1000) };
          }
          return marker;
      })
      .sort((a, b) => (typeof a.time === 'number' && typeof b.time === 'number') ? a.time - b.time : 0)
      .filter((marker, index, self) => 
          index === self.findIndex((t) => t.time === marker.time && t.text === marker.text)
      );

      series.setMarkers(finalMarkers);
      
      if (chartData.length > 0) {
        chartRef.current?.timeScale().fitContent();
      }
    }
  }, [chartData, trades, ticker]);

  // Live Price update
  useEffect(() => {
    if (priceLineRef.current && livePrice) {
      priceLineRef.current.applyOptions({ price: livePrice });
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
