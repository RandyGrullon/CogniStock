import uuid
from datetime import datetime
from typing import List, Dict, Any
from data.market_data import get_ticker_data, get_price_history
from data.indicators import calculate_indicators, interpret_indicators
from core.ai_client import AIClient
from data.news import get_company_news, get_market_sentiment
from database.adapter import DatabaseAdapter
from memory.rag import RAGSystem

class StockAnalyzer:
    def __init__(self, db: DatabaseAdapter, ai_client: AIClient):
        self.db = db
        self.ai_client = ai_client
        self.rag = RAGSystem(db)

    def analyze_ticker(self, ticker: str) -> Dict[str, Any]:
        # 1. Fetch data
        fundamentals = get_ticker_data(ticker)
        history = get_price_history(ticker)
        
        # 2. Technical analysis
        tech_data = calculate_indicators(history)
        tech_interpretation = interpret_indicators(tech_data)
        
        # 3. Memory (Using RAG)
        memory_str = self.rag.get_relevant_memory(ticker)
        
        # 4. News & Sentiment
        news = get_company_news(ticker)
        sentiment = get_market_sentiment(ticker)
        
        # 5. AI analysis
        analysis_result = self.ai_client.analyze_stock(
            ticker=ticker,
            technical_analysis={**tech_data, **tech_interpretation},
            fundamentals={**fundamentals, "sentiment": sentiment},
            news=news,
            historical_memory=memory_str
        )
        
        # 6. Save analysis
        analysis_id = str(uuid.uuid4())
        full_analysis = {
            "id": analysis_id,
            "ticker": ticker,
            "fecha": datetime.now().isoformat(),
            "precio_actual": fundamentals.get("price", 0),
            **analysis_result,
            "datos_tecnicos": str(tech_data),
            "datos_fundamentales": str(fundamentals)
        }
        
        # Flatten risks and lecciones for DB if they are lists
        if isinstance(full_analysis.get('riesgos'), list):
            full_analysis['riesgos'] = ",".join(full_analysis['riesgos'])
        
        self.db.insert_analysis(full_analysis)
        
        return full_analysis

    def _format_lessons(self, lessons: List[Dict[str, Any]]) -> str:
        if not lessons:
            return "No hay lecciones previas para este ticker."
        
        formatted = []
        for l in lessons:
            formatted.append(f"- {l['titulo']}: {l['leccion']} (Tags: {l['tags']})")
        return "\n".join(formatted)
