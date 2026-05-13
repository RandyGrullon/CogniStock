from typing import Dict, Any
from .rag import RAGSystem
from ..database.adapter import DatabaseAdapter
from ..core.ai_client import AIClient

class LessonManager:
    def __init__(self, db: DatabaseAdapter, ai_client: AIClient):
        self.db = db
        self.ai_client = ai_client

    def process_closed_trade(self, trade_id: str):
        # 1. Get trade info
        with self.db.engine.connect() as conn:
            result = conn.execute(self.db.trades.select().where(self.db.trades.c.id == trade_id))
            trade = result.fetchone()
            if not trade:
                return
            trade = dict(trade._asdict())

        # 2. Analyze outcome (Already has PnL in DB from execute_sell)
        outcome = {
            "pnl": trade['pnl'],
            "pnl_porcentaje": trade['pnl_porcentaje'],
            "contexto_mercado": f"Precio salida: {trade['precio_salida']} el {trade['fecha_salida']}"
        }

        # 3. Generate lesson with AI
        try:
            lesson_data = self.ai_client.generate_lesson(trade, outcome)
            
            # 4. Save to DB
            lesson_to_save = {
                "id": str(uuid.uuid4()),
                "trade_id": trade_id,
                "ticker": trade['ticker'],
                "fecha": datetime.now().isoformat(),
                **lesson_data
            }
            # Convert tags list to string if necessary
            if isinstance(lesson_to_save.get('tags'), list):
                lesson_to_save['tags'] = ",".join(lesson_to_save['tags'])
                
            self.db.insert_lesson(lesson_to_save)
            
            # Mark trade as having a lesson generated
            self.db.update_trade(trade_id, {"leccion_generada": 1})
        except Exception as e:
            print(f"Error generando lección para {trade_id}: {e}")
