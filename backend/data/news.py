import os
import finnhub
from datetime import datetime, timedelta
from typing import List, Dict, Any

def get_company_news(ticker: str, days_back: int = 7) -> List[Dict[str, Any]]:
    api_key = os.getenv("FINNHUB_API_KEY")
    if not api_key:
        # Fallback to empty or mock if no key
        return []
        
    try:
        configuration = finnhub.Configuration()
        configuration.api_key['api_key'] = api_key
        client = finnhub.DefaultApi(finnhub.ApiClient(configuration))
        
        # Calculate dates for the last week
        to_date = datetime.now().strftime('%Y-%m-%d')
        from_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        
        news = client.company_news(ticker, _from=from_date, to=to_date)
        
        formatted_news = []
        for item in news[:15]: # Top 15 news for better AI context
            formatted_news.append({
                "headline": item.headline,
                "summary": item.summary,
                "url": item.url,
                "datetime": item.datetime,
                "source": item.source,
                "category": item.category
            })
        return formatted_news
    except Exception as e:
        print(f"Error fetching Finnhub news for {ticker}: {e}")
        return []

def get_market_sentiment(ticker: str) -> Dict[str, Any]:
    """Obtiene el sentimiento de noticias de Finnhub para un ticker."""
    api_key = os.getenv("FINNHUB_API_KEY")
    if not api_key: return {}
    
    try:
        configuration = finnhub.Configuration()
        configuration.api_key['api_key'] = api_key
        client = finnhub.DefaultApi(finnhub.ApiClient(configuration))
        
        sentiment = client.news_sentiment(ticker)
        return {
            "buzz": sentiment.buzz,
            "sentiment": sentiment.sentiment,
            "sector_average_bullish_percent": sentiment.sector_average_bullish_percent,
            "company_news_score": sentiment.company_news_score
        }
    except:
        return {}
