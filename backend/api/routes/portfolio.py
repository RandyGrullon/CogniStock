from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from core.portfolio import PortfolioManager
from api.schemas import TradeRequest, PortfolioStatus
from api.deps import get_portfolio_manager, get_db

router = APIRouter()

@router.get("/status", response_model=PortfolioStatus)
async def get_portfolio_status(db = Depends(get_db)):
    status = db.get_portfolio_status()
    if not status:
        return {
            "capital_inicial": 100000.0,
            "capital_disponible": 100000.0,
            "valor_posiciones": 0.0,
            "capital_total": 100000.0,
            "total_trades": 0,
            "ultima_actualizacion": None
        }
    return status

@router.post("/trade")
async def execute_trade(request: TradeRequest, pm: PortfolioManager = Depends(get_portfolio_manager)):
    result = pm.execute_trade(
        ticker=request.ticker,
        side=request.side,
        amount=request.amount,
        reasoning=request.reasoning
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/trades/{trade_id}/close")
async def close_trade(trade_id: str, request: Dict[str, str], pm: PortfolioManager = Depends(get_portfolio_manager)):
    reasoning = request.get("reasoning", "Cierre manual")
    result = pm.execute_sell(trade_id=trade_id, reasoning=reasoning)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/lessons")
async def get_lessons(db = Depends(get_db)):
    return db.get_lessons(limit=20)

@router.get("/trades")
async def get_trades(db = Depends(get_db)):
    try:
        response = db.supabase.table("trades").select("*").order("fecha_entrada", desc=True).execute()
        return response.data
    except:
        with db.engine.connect() as conn:
            result = conn.execute(db.trades.select().order_by(db.trades.c.fecha_entrada.desc()))
            return [dict(row._asdict()) for row in result]
