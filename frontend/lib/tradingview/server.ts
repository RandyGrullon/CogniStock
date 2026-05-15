/**
 * Factory de WebSocket para entornos server (Node) que cae al paquete `ws`
 * si el runtime no expone `WebSocket` global (Node 20).
 *
 * Solo importar desde código server-only (API Routes / lib usada solo por ellas).
 */

import type { WSFactory } from "./client";
import WebSocketNode from "ws";

let cached: WSFactory | null = null;

export function getServerWsFactory(): WSFactory {
  if (cached) return cached;
  cached = (url, opts) => {
    const G = globalThis as typeof globalThis & { WebSocket?: new (u: string) => unknown };
    if (typeof G.WebSocket === "function") {
      return new G.WebSocket(url) as ReturnType<WSFactory>;
    }
    return new WebSocketNode(url, {
      headers: { Origin: opts?.origin ?? "https://www.tradingview.com" },
    }) as ReturnType<WSFactory>;
  };
  return cached;
}
