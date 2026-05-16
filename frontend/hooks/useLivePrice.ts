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

export function useLivePrice(ticker: string | null | undefined): Tick | null {
  // TradingView WS is currently blocking browser connections (CORS/403).
  // We return null to force the app to use the HTTP fallback (useSWR).
  return null;
}

export function useLivePrices(tickers: string[]): Record<string, Tick> {
  // Return empty record to force HTTP fallback
  return {};
}
