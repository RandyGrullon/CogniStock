/**
 * Cliente WebSocket de TradingView portado desde backend/data/live_market.py.
 *
 * Funciona en navegador y Edge Runtime de Vercel (WebSocket nativo).
 * Para Node, pasa una implementacion de WebSocket via `wsImpl` (ej. paquete `ws`).
 */

export type Tick = {
  symbol: string;
  price: number;
  ts: number;
  change?: number;
  changePercent?: number;
};

export type TickListener = (tick: Tick) => void;

/**
 * Mapeo de tickers comunes al simbolo de TradingView con exchange.
 * Si pasas algo que no esta en el mapa, se asume NASDAQ:<TICKER>.
 */
export const SYMBOL_MAP: Record<string, string> = {
  XAUUSD: "OANDA:XAUUSD",
  "GC=F": "OANDA:XAUUSD",
  XAGUSD: "OANDA:XAGUSD",
  BTC: "BITSTAMP:BTCUSD",
  "BTC-USD": "BITSTAMP:BTCUSD",
  BTCUSD: "BITSTAMP:BTCUSD",
  ETH: "BITSTAMP:ETHUSD",
  "ETH-USD": "BITSTAMP:ETHUSD",
  EURUSD: "FX:EURUSD",
  GBPUSD: "FX:GBPUSD",
  USDJPY: "FX:USDJPY",
  AAPL: "NASDAQ:AAPL",
  TSLA: "NASDAQ:TSLA",
  NVDA: "NASDAQ:NVDA",
  MSFT: "NASDAQ:MSFT",
  META: "NASDAQ:META",
  AMZN: "NASDAQ:AMZN",
  AMD: "NASDAQ:AMD",
  GOOGL: "NASDAQ:GOOGL",
  SPY: "AMEX:SPY",
  QQQ: "NASDAQ:QQQ",
};

export function toTvSymbol(input: string): string {
  const up = input.toUpperCase();
  if (SYMBOL_MAP[up]) return SYMBOL_MAP[up];
  if (up.includes(":")) return up;
  return `NASDAQ:${up}`;
}

export function fromTvSymbol(tv: string): string {
  return tv.includes(":") ? tv.split(":").pop()! : tv;
}

const TV_WS_URL = "wss://data.tradingview.com/socket.io/websocket";
const TV_ORIGIN = "https://www.tradingview.com";

function genSession(prefix = "qs"): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let s = `${prefix}_`;
  for (let i = 0; i < 12; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return s;
}

function prepend(msg: string): string {
  return `~m~${msg.length}~m~${msg}`;
}

function makeMessage(func: string, params: any[]): string {
  return prepend(JSON.stringify({ m: func, p: params }));
}

type WSLike = {
  send: (data: string) => void;
  close: () => void;
  addEventListener?: (type: string, cb: any) => void;
  onmessage?: ((ev: any) => any) | null;
  onopen?: ((ev: any) => any) | null;
  onclose?: ((ev: any) => any) | null;
  onerror?: ((ev: any) => any) | null;
  readyState?: number;
};

export type WSFactory = (url: string, opts?: { origin?: string }) => WSLike;

/** Factory por defecto que usa WebSocket nativo (browser / Edge runtime). */
export const defaultWSFactory: WSFactory = (url) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const W: any = (globalThis as any).WebSocket;
  if (!W) {
    throw new Error(
      "WebSocket global no disponible. En Node pasa wsImpl con el paquete 'ws'."
    );
  }
  return new W(url) as WSLike;
};

/**
 * Cliente streaming. Mantiene la conexion abierta y emite ticks por listener.
 * Pensado para navegador (hook useLivePrice) o un worker Node aparte.
 */
export class TradingViewLiveClient {
  private ws: WSLike | null = null;
  private listeners = new Set<TickListener>();
  private symbols = new Set<string>();
  private session = genSession();
  private reconnectTimer: any = null;
  private wsFactory: WSFactory;
  private connected = false;
  private shouldReconnect = true;

  constructor(opts?: { wsFactory?: WSFactory }) {
    this.wsFactory = opts?.wsFactory ?? defaultWSFactory;
  }

  subscribe(symbol: string): void {
    const tv = toTvSymbol(symbol);
    if (this.symbols.has(tv)) return;
    this.symbols.add(tv);
    if (this.connected && this.ws) {
      this.ws.send(makeMessage("quote_add_symbols", [this.session, tv]));
    }
  }

  unsubscribe(symbol: string): void {
    const tv = toTvSymbol(symbol);
    if (!this.symbols.has(tv)) return;
    this.symbols.delete(tv);
    if (this.connected && this.ws) {
      this.ws.send(makeMessage("quote_remove_symbols", [this.session, tv]));
    }
  }

  onTick(cb: TickListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private connectCount = 0;
  private maxConnectAttempts = 3; // Reducido para ser menos intrusivo
  private gaveUp = false;

  connect(): void {
    if (this.ws || this.gaveUp) return;
    this.shouldReconnect = true;
    this.session = genSession();
    
    if (this.connectCount >= this.maxConnectAttempts) {
      this.gaveUp = true;
      console.warn("TV WS: Maximo de intentos alcanzado. Usando fallback HTTP.");
      return;
    }
    const ws = this.ws!;

    const handleOpen = () => {
      this.connected = true;
      this.connectCount = 0; // Reset on success
      ws.send(makeMessage("set_auth_token", ["unauthorized_user_token"]));
      ws.send(makeMessage("quote_create_session", [this.session]));
      ws.send(
        makeMessage("quote_set_fields", [this.session, "lp", "ch", "chp"])
      );
      if (this.symbols.size > 0) {
        ws.send(
          makeMessage("quote_add_symbols", [
            this.session,
            ...Array.from(this.symbols),
          ])
        );
      }
    };

    const handleMessage = (ev: any) => {
      const raw: string = typeof ev?.data === "string" ? ev.data : String(ev?.data ?? ev);
      // Heartbeat: ~m~LEN~m~~h~N -> hay que devolverlo tal cual
      const heartbeat = raw.match(/~m~\d+~m~~h~\d+/);
      if (heartbeat) {
        ws.send(raw);
        return;
      }
      const parts = raw.split(/~m~\d+~m~/);
      for (const part of parts) {
        if (!part) continue;
        try {
          const data = JSON.parse(part);
          if (data?.m === "qsd") {
            const quote = data.p?.[1];
            const name: string = quote?.n ?? "";
            const v = quote?.v ?? {};
            if (typeof v.lp === "number") {
              const tick: Tick = {
                symbol: fromTvSymbol(name),
                price: v.lp,
                ts: Date.now(),
                change: typeof v.ch === "number" ? v.ch : undefined,
                changePercent: typeof v.chp === "number" ? v.chp : undefined,
              };
              this.listeners.forEach((l) => {
                try {
                  l(tick);
                } catch {
                  // swallow listener errors
                }
              });
            }
          }
        } catch {
          // ignore non-json frames
        }
      }
    };

    const handleClose = () => {
      this.connected = false;
      this.ws = null;
      if (this.shouldReconnect) this.scheduleReconnect();
    };

    const handleError = () => {
      this.connected = false;
      try {
        ws.close();
      } catch {
        // ignore
      }
    };

    if (typeof ws.addEventListener === "function") {
      ws.addEventListener("open", handleOpen);
      ws.addEventListener("message", handleMessage);
      ws.addEventListener("close", handleClose);
      ws.addEventListener("error", handleError);
    } else {
      ws.onopen = handleOpen;
      ws.onmessage = handleMessage;
      ws.onclose = handleClose;
      ws.onerror = handleError;
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
    }
    this.ws = null;
    this.connected = false;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) this.connect();
    }, 3000);
  }
}

/**
 * One-shot snapshot: abre el WS, espera el primer tick del simbolo y resuelve.
 * Pensado para Edge Routes / scripts puntuales.
 */
export async function getQuote(
  symbol: string,
  opts: { timeoutMs?: number; wsFactory?: WSFactory } = {}
): Promise<Tick> {
  const timeoutMs = opts.timeoutMs ?? 3000;
  const tv = toTvSymbol(symbol);
  const session = genSession();
  const factory = opts.wsFactory ?? defaultWSFactory;

  return await new Promise<Tick>((resolve, reject) => {
    let ws: WSLike;
    try {
      ws = factory(TV_WS_URL, { origin: TV_ORIGIN });
    } catch (e: any) {
      reject(e);
      return;
    }

    let settled = false;
    const finish = (val: Tick | Error) => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        // ignore
      }
      if (val instanceof Error) reject(val);
      else resolve(val);
    };

    const timeout = setTimeout(() => {
      finish(new Error(`TradingView quote timeout for ${symbol}`));
    }, timeoutMs);

    const onOpen = () => {
      ws.send(makeMessage("set_auth_token", ["unauthorized_user_token"]));
      ws.send(makeMessage("quote_create_session", [session]));
      ws.send(makeMessage("quote_set_fields", [session, "lp", "ch", "chp"]));
      ws.send(makeMessage("quote_add_symbols", [session, tv]));
    };

    const onMessage = (ev: any) => {
      const raw: string = typeof ev?.data === "string" ? ev.data : String(ev?.data ?? ev);
      if (/~m~\d+~m~~h~\d+/.test(raw)) {
        ws.send(raw);
        return;
      }
      const parts = raw.split(/~m~\d+~m~/);
      for (const part of parts) {
        if (!part) continue;
        try {
          const data = JSON.parse(part);
          if (data?.m === "qsd") {
            const v = data.p?.[1]?.v ?? {};
            if (typeof v.lp === "number") {
              clearTimeout(timeout);
              finish({
                symbol: fromTvSymbol(tv),
                price: v.lp,
                ts: Date.now(),
                change: typeof v.ch === "number" ? v.ch : undefined,
                changePercent: typeof v.chp === "number" ? v.chp : undefined,
              });
              return;
            }
          }
        } catch {
          // ignore
        }
      }
    };

    const onError = () => {
      clearTimeout(timeout);
      finish(new Error(`TradingView WS error for ${symbol}`));
    };

    if (typeof ws.addEventListener === "function") {
      ws.addEventListener("open", onOpen);
      ws.addEventListener("message", onMessage);
      ws.addEventListener("error", onError);
    } else {
      ws.onopen = onOpen;
      ws.onmessage = onMessage;
      ws.onerror = onError;
    }
  });
}
