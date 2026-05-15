from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from ..deps import get_db
from data.market_data import get_price_history, get_ticker_data

router = APIRouter()

@router.get("/recent")
async def get_recent_analysis(db = Depends(get_db)):
    try:
        return db.get_recent_analysis(limit=10)
    except Exception as e:
        return []

@router.get("/price/{ticker}")
async def get_price(ticker: str):
    try:
        data = get_ticker_data(ticker)
        return {
            "ticker": ticker.toUpperCase() if hasattr(ticker, 'toUpperCase') else ticker.upper(),
            "price": data['price'],
            "change": 0.0, # Could be calculated if needed
            "name": ticker.upper()
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found")

@router.get("/chart/{ticker}")
async def get_chart_data(ticker: str):
    try:
        df = get_price_history(ticker, period="3mo")
        if df.empty:
            raise HTTPException(status_code=404, detail="Ticker not found or no data available")
        
        # Format for lightweight-charts: { time: 'YYYY-MM-DD', open, high, low, close }
        chart_data = []
        for index, row in df.iterrows():
            chart_data.append({
                "time": index.strftime('%Y-%m-%d'),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close'])
            })
        
        return chart_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
