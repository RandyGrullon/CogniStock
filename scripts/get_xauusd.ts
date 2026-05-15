/**
 * Script standalone para obtener el precio actual de XAUUSD (Oro) desde TradingView.
 *
 * Uso:
 *   cd frontend
 *   npx tsx ../scripts/get_xauusd.ts            # snapshot one-shot
 *   npx tsx ../scripts/get_xauusd.ts --stream   # streaming continuo
 *   npx tsx ../scripts/get_xauusd.ts AAPL TSLA  # otros tickers
 *
 * Requiere `ws` (paquete) instalado: `npm i ws @types/ws`.
 */

import WebSocketNode from "ws";
import {
  TradingViewLiveClient,
  getQuote,
  type WSFactory,
} from "../frontend/lib/tradingview/client";

const wsFactory: WSFactory = (url, opts) => {
  const ws = new WebSocketNode(url, {
    headers: { Origin: opts?.origin ?? "https://www.tradingview.com" },
  });
  return ws as any;
};

async function snapshot(symbols: string[]) {
  for (const symbol of symbols) {
    try {
      const tick = await getQuote(symbol, { timeoutMs: 5000, wsFactory });
      console.log(
        `${tick.symbol.padEnd(10)} $${tick.price.toFixed(2).padStart(10)}  ` +
          (tick.changePercent !== undefined
            ? `${tick.changePercent >= 0 ? "+" : ""}${tick.changePercent.toFixed(2)}%`
            : "")
      );
    } catch (e: any) {
      console.error(`${symbol}: ${e.message}`);
    }
  }
}

function stream(symbols: string[]) {
  const client = new TradingViewLiveClient({ wsFactory });
  symbols.forEach((s) => client.subscribe(s));
  client.onTick((tick) => {
    const t = new Date(tick.ts).toISOString().split("T")[1].replace("Z", "");
    console.log(
      `[${t}] ${tick.symbol.padEnd(10)} $${tick.price.toFixed(2).padStart(10)}  ` +
        (tick.changePercent !== undefined
          ? `${tick.changePercent >= 0 ? "+" : ""}${tick.changePercent.toFixed(2)}%`
          : "")
    );
  });
  client.connect();
  process.on("SIGINT", () => {
    console.log("\nDesconectando...");
    client.disconnect();
    process.exit(0);
  });
}

const args = process.argv.slice(2);
const isStream = args.includes("--stream");
const symbols = args.filter((a) => !a.startsWith("--"));
const list = symbols.length > 0 ? symbols : ["XAUUSD"];

if (isStream) {
  console.log(`Streaming ${list.join(", ")} desde TradingView. Ctrl+C para salir.`);
  stream(list);
} else {
  snapshot(list).then(() => process.exit(0));
}
