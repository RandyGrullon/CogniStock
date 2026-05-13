import yfinance as yf
import pandas as pd
from typing import Dict, Any, Optional

def get_ticker_data(ticker: str) -> Dict[str, Any]:
    t = yf.Ticker(ticker)
    info = t.info
    
    return {
        "price": info.get('currentPrice', info.get('regularMarketPrice')),
        "market_cap": info.get('marketCap'),
        "pe_ratio": info.get('trailingPE'),
        "eps": info.get('trailingEps'),
        "profit_margins": info.get('profitMargins'),
        "debt_to_equity": info.get('debtToEquity'),
        "dividend_yield": info.get('dividendYield'),
        "beta": info.get('beta'),
        "next_earnings": info.get('nextEarningsDate')
    }

def get_price_history(ticker: str, period: str = "3mo") -> pd.DataFrame:
    t = yf.Ticker(ticker)
    return t.history(period=period)
