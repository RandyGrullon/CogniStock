import uuid
from datetime import datetime
from typing import Dict, Any, List
from ..database.adapter import DatabaseAdapter
from ..data.market_data import get_ticker_data

class PortfolioManager:
    def __init__(self, db: DatabaseAdapter, lesson_manager=None):
        self.db = db
        self.lesson_manager = lesson_manager

    def execute_trade(self, ticker: str, side: str, amount: int, reasoning: str) -> Dict[str, Any]:
        data = get_ticker_data(ticker)
        price = data['price']
        
        status = self.db.get_portfolio_status()
        if not status:
            # Initialize if not exists
            status = {
                "capital_inicial": 100000.0,
                "capital_disponible": 100000.0,
                "valor_posiciones": 0.0,
                "capital_total": 100000.0,
                "total_trades": 0,
                "trades_ganadores": 0,
                "trades_perdedores": 0,
                "ultima_actualizacion": datetime.now().isoformat()
            }
            self.db.update_portfolio_status(status)
            status = self.db.get_portfolio_status()

        cost = price * amount
        
        if side == "BUY":
            if status['capital_disponible'] < cost:
                return {"error": "Capital insuficiente"}
            
            new_available = status['capital_disponible'] - cost
            self.db.update_portfolio_status({
                "capital_disponible": new_available,
                "ultima_actualizacion": datetime.now().isoformat()
            })
            
            trade = {
                "id": str(uuid.uuid4()),
                "ticker": ticker,
                "tipo": "BUY",
                "acciones": amount,
                "precio_entrada": price,
                "precio_actual": price,
                "fecha_entrada": datetime.now().isoformat(),
                "razonamiento": reasoning,
                "estado": "OPEN"
            }
            self.db.insert_trade(trade)
            return trade
            
        return {"error": "Side no soportado por ahora"}

    def update_portfolio_values(self):
        open_trades = self.db.get_open_trades()
        total_value_posiciones = 0.0
        
        for trade in open_trades:
            data = get_ticker_data(trade['ticker'])
            current_price = data['price']
            
            pnl = (current_price - trade['precio_entrada']) * trade['acciones']
            pnl_pct = ((current_price / trade['precio_entrada']) - 1) * 100
            
            self.db.update_trade(trade['id'], {
                "precio_actual": current_price,
                "pnl": pnl,
                "pnl_porcentaje": pnl_pct
            })
            
            total_value_posiciones += current_price * trade['acciones']
            
        status = self.db.get_portfolio_status()
        self.db.update_portfolio_status({
            "valor_posiciones": total_value_posiciones,
            "capital_total": status['capital_disponible'] + total_value_posiciones,
            "ultima_actualizacion": datetime.now().isoformat()
        })
            
    def execute_sell(self, trade_id: str, reasoning: str) -> Dict[str, Any]:
        with self.db.engine.connect() as conn:
            # We use SQLAlchemy Table object from the adapter
            result = conn.execute(self.db.trades.select().where(self.db.trades.c.id == trade_id))
            trade = result.fetchone()
            if not trade:
                return {"error": "Trade no encontrado"}
            trade = dict(trade._asdict())

        data = get_ticker_data(trade['ticker'])
        price = data['price']
        
        pnl = (price - trade['precio_entrada']) * trade['acciones']
        pnl_pct = ((price / trade['precio_entrada']) - 1) * 100
        
        status = self.db.get_portfolio_status()
        new_available = status['capital_disponible'] + (price * trade['acciones'])
        
        self.db.update_trade(trade_id, {
            "precio_salida": price,
            "fecha_salida": datetime.now().isoformat(),
            "estado": "CLOSED",
            "pnl": pnl,
            "pnl_porcentaje": pnl_pct
        })
        
        self.db.update_portfolio_status({
            "capital_disponible": new_available,
            "total_trades": status.get('total_trades', 0) + 1,
            "trades_ganadores": status.get('trades_ganadores', 0) + (1 if pnl > 0 else 0),
            "trades_perdedores": status.get('trades_perdedores', 0) + (1 if pnl <= 0 else 0),
            "ultima_actualizacion": datetime.now().isoformat()
        })
        
        if self.lesson_manager:
            self.lesson_manager.process_closed_trade(trade_id)
        
        return {"id": trade_id, "pnl": pnl, "pnl_pct": pnl_pct}
