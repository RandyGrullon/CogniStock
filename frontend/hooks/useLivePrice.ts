"use client";

import { useEffect, useState, useRef } from "react";
import {
  TradingViewLiveClient,
  type Tick,
} from "@/lib/tradingview/client";

/**
 * Singleton de cliente WS para todo el navegador. Una conexión compartida
 * a TradingView con suscripciones por contador de referencias.
 */
type RefCount = { count: number };
const refs: Map<string, RefCount> = new Map();
let sharedClient: TradingViewLiveClient | null = null;
const lastTickByTicker: Map<string, Tick> = new Map();
const listenersByTicker: Map<string, Set<(t: Tick) => void>> = new Map();

function getClient(): TradingViewLiveClient {
  if (typeof window === "undefined") {
    throw new Error("useLivePrice solo puede usarse en el navegador");
  }
  if (sharedClient) return sharedClient;
  sharedClient = new TradingViewLiveClient();
  sharedClient.onTick((tick) => {
    const key = tick.symbol.toUpperCase();
    lastTickByTicker.set(key, tick);
    const ls = listenersByTicker.get(key);
    if (ls) ls.forEach((cb) => cb(tick));
  });
  sharedClient.connect();
  return sharedClient;
}

function addRef(ticker: string): void {
  const key = ticker.toUpperCase();
  const c = refs.get(key);
  if (c) {
    c.count += 1;
    return;
  }
  refs.set(key, { count: 1 });
  getClient().subscribe(key);
}

function removeRef(ticker: string): void {
  const key = ticker.toUpperCase();
  const c = refs.get(key);
  if (!c) return;
  c.count -= 1;
  if (c.count <= 0) {
    refs.delete(key);
    if (sharedClient) sharedClient.unsubscribe(key);
  }
}

/**
 * Suscribe a precio en vivo para un ticker individual.
 * Devuelve el último tick recibido (o null mientras no hay datos).
 */
export function useLivePrice(ticker: string | null | undefined): Tick | null {
  const [tick, setTick] = useState<Tick | null>(null);
  const tickerRef = useRef(ticker);

  useEffect(() => {
    tickerRef.current = ticker;
    if (!ticker) return;
    const key = ticker.toUpperCase();
    // Hidrata con último valor cacheado si existe
    const cached = lastTickByTicker.get(key);
    if (cached) setTick(cached);
    addRef(key);
    let cbs = listenersByTicker.get(key);
    if (!cbs) {
      cbs = new Set();
      listenersByTicker.set(key, cbs);
    }
    const cb = (t: Tick) => setTick(t);
    cbs.add(cb);
    return () => {
      cbs!.delete(cb);
      if (cbs!.size === 0) listenersByTicker.delete(key);
      removeRef(key);
    };
  }, [ticker]);

  return tick;
}

/**
 * Suscribe varios tickers a la vez. Devuelve mapa { TICKER: Tick }.
 */
export function useLivePrices(tickers: string[]): Record<string, Tick> {
  const [ticks, setTicks] = useState<Record<string, Tick>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const keys = tickers.map((t) => t.toUpperCase()).filter(Boolean);
    if (!keys.length) return;
    const updates: Record<string, Tick> = {};
    for (const key of keys) {
      const cached = lastTickByTicker.get(key);
      if (cached) updates[key] = cached;
    }
    if (Object.keys(updates).length) {
      setTicks((prev) => ({ ...prev, ...updates }));
    }
    const callbacks: { key: string; cb: (t: Tick) => void }[] = [];
    for (const key of keys) {
      addRef(key);
      let cbs = listenersByTicker.get(key);
      if (!cbs) {
        cbs = new Set();
        listenersByTicker.set(key, cbs);
      }
      const cb = (t: Tick) => setTicks((prev) => ({ ...prev, [key]: t }));
      cbs.add(cb);
      callbacks.push({ key, cb });
    }
    return () => {
      for (const { key, cb } of callbacks) {
        const cbs = listenersByTicker.get(key);
        if (cbs) {
          cbs.delete(cb);
          if (cbs.size === 0) listenersByTicker.delete(key);
        }
        removeRef(key);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickers.join(",")]);

  return ticks;
}
