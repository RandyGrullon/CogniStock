from typing import List, Dict, Any, Optional
from ..database.adapter import DatabaseAdapter

class RAGSystem:
    def __init__(self, db: DatabaseAdapter):
        self.db = db

    def get_relevant_memory(self, ticker: str) -> str:
        """
        Recupera lecciones y trades pasados relevantes para un ticker.
        """
        # 1. Buscar lecciones por ticker o tags relacionados
        lessons = self.db.get_lessons(ticker=ticker, limit=5)
        
        # 2. Buscar trades cerrados recientemente para este ticker
        # (This would need a method in the adapter to get closed trades by ticker)
        # For now, let's assume get_lessons is enough or we use the formatted lessons from analyzer
        
        if not lessons:
            return "No hay antecedentes específicos para este ticker en la memoria."
            
        memory_parts = []
        for lesson in lessons:
            part = f"[{lesson['fecha']}] {lesson['titulo']}: {lesson['leccion']} (Patrón: {lesson['patron']})"
            memory_parts.append(part)
            
        return "\n\n".join(memory_parts)
