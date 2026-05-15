import yfinance as yf
import pandas as pd
from typing import Dict, Any, Optional

from data.live_market import tv_live

# Cache for ticker objects to speed up polling
_ticker_cache = {}

def get_ticker_data(ticker: str) -> Dict[str, Any]:
    # 1. Try instantaneous TradingView source first
    # Map common tickers to TV symbols if needed
    tv_ticker = ticker
    if ticker == "GC=F": tv_ticker = "XAUUSD"
    if ticker == "BTC-USD": tv_ticker = "BTCUSD"
    
    if tv_ticker in tv_live.prices:
        # We still need metadata from info, but price is live
        price = tv_live.prices[tv_ticker]
        # Get metadata from cache if exists to avoid slow calls
        if ticker in _ticker_cache:
            t = _ticker_cache[ticker]
            return {
                "price": price,
                "market_cap": getattr(t.info, 'get', lambda x: None)('marketCap'),
                "pe_ratio": getattr(t.info, 'get', lambda x: None)('trailingPE'),
                "eps": getattr(t.info, 'get', lambda x: None)('trailingEps'),
                "profit_margins": getattr(t.info, 'get', lambda x: None)('profitMargins'),
                "debt_to_equity": getattr(t.info, 'get', lambda x: None)('debtToEquity'),
                "dividend_yield": getattr(t.info, 'get', lambda x: None)('dividendYield'),
                "beta": getattr(t.info, 'get', lambda x: None)('beta'),
                "next_earnings": getattr(t.info, 'get', lambda x: None)('nextEarningsDate')
            }
    
    # 2. Fallback to optimized yfinance polling
    if ticker not in _ticker_cache:
        _ticker_cache[ticker] = yf.Ticker(ticker)
    
    t = _ticker_cache[ticker]
    
    # Try to get the fast price first for live terminal feel
    try:
        price = t.fast_info.get('last_price')
        if not price:
            info = t.info
            price = info.get('currentPrice', info.get('regularMarketPrice', 0))
    except:
        # Fallback if fast_info fails
        info = t.info
        price = info.get('currentPrice', info.get('regularMarketPrice', 0))
    
    return {
        "price": float(price),
        "market_cap": getattr(t.info, 'get', lambda x: None)('marketCap'),
        "pe_ratio": getattr(t.info, 'get', lambda x: None)('trailingPE'),
        "eps": getattr(t.info, 'get', lambda x: None)('trailingEps'),
        "profit_margins": getattr(t.info, 'get', lambda x: None)('profitMargins'),
        "debt_to_equity": getattr(t.info, 'get', lambda x: None)('debtToEquity'),
        "dividend_yield": getattr(t.info, 'get', lambda x: None)('dividendYield'),
        "beta": getattr(t.info, 'get', lambda x: None)('beta'),
        "next_earnings": getattr(t.info, 'get', lambda x: None)('nextEarningsDate')
    }

def get_price_history(ticker: str, period: str = "3mo") -> pd.DataFrame:
    t = yf.Ticker(ticker)
    return t.history(period=period)
