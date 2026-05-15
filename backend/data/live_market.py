import asyncio
import json
import random
import string
import re
import threading
import websockets
from typing import Dict, Any, List

class TradingViewLive:
    def __init__(self):
        self.prices = {}
        self.uri = "wss://data.tradingview.com/socket.io/websocket"
        self.headers = {"Origin": "https://www.tradingview.com"}
        self.symbols = ["OANDA:XAUUSD", "BITSTAMP:BTCUSD", "FX:EURUSD", "NASDAQ:AAPL", "NASDAQ:TSLA", "NASDAQ:NVDA"]
        self.session = self.generate_session()
        self.is_running = False
        self._thread = None

    def generate_session(self):
        letters = string.ascii_lowercase
        return "qs_" + "".join(random.choice(letters) for _ in range(12))

    def prepend_header(self, st):
        return f"~m~{len(st)}~m~{st}"

    def create_message(self, func, param_list):
        return self.prepend_header(json.dumps({"m": func, "p": param_list}, separators=(",", ":")))

    async def run(self):
        while True:
            try:
                async with websockets.connect(self.uri, extra_headers=self.headers) as ws:
                    self.is_running = True
                    # Initialize session
                    await ws.send(self.create_message("set_auth_token", ["unauthorized_user_token"]))
                    await ws.send(self.create_message("quote_create_session", [self.session]))
                    await ws.send(self.create_message("quote_set_fields", [self.session, "lp", "ch", "chp"]))
                    await ws.send(self.create_message("quote_add_symbols", [self.session] + self.symbols))

                    async for message in ws:
                        # Handle Heartbeat
                        if re.match(r"~m~\d+~m~~h~\d+", message):
                            await ws.send(message)
                            continue

                        # Parse Data
                        msgs = re.split(r"~m~\d+~m~", message)
                        for msg in msgs:
                            if not msg: continue
                            try:
                                data = json.loads(msg)
                                if data["m"] == "qsd":
                                    quote = data["p"][1]
                                    name = quote.get("n", "")
                                    values = quote.get("v", {})
                                    if "lp" in values:
                                        ticker = name.split(":")[-1]
                                        self.prices[ticker] = float(values["lp"])
                                        # Also store with full name for safety
                                        self.prices[name] = float(values["lp"])
                            except:
                                continue
            except Exception as e:
                print(f"TradingView WS Error: {e}. Reconnecting in 5s...")
                self.is_running = False
                await asyncio.sleep(5)

    def start(self):
        def _run():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(self.run())

        self._thread = threading.Thread(target=_run, daemon=True)
        self._thread.start()

# Global instance
tv_live = TradingViewLive()
