from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AnalysisRequest(BaseModel):
    ticker: str

class TradeRequest(BaseModel):
    ticker: str
    side: str
    amount: float
    reasoning: str

class AnalysisResponse(BaseModel):
    id: str
    ticker: str
    fecha: str
    recomendacion: str
    confianza: int
    nivel_riesgo: str
    razonamiento: str
    riesgos: List[str]
    precio_objetivo: Optional[float]
    stop_loss: Optional[float]
    horizonte: str
    lecciones_aplicadas: List[str]

class PortfolioStatus(BaseModel):
    capital_inicial: float
    capital_disponible: float
    valor_posiciones: float
    capital_total: float
    total_trades: int
    ultima_actualizacion: Optional[str]
