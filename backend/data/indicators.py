import pandas as pd
# Import the compatible version
import pandas_ta_classic as ta
from typing import Dict, Any

def calculate_indicators(df: pd.DataFrame) -> Dict[str, Any]:
    if df.empty:
        return {}
        
    # Using the standard extension style which is preserved in pandas-ta-classic
    # Ensure columns are float for calculations
    df = df.copy()
    
    # RSI
    df['rsi'] = ta.rsi(df['Close'], length=14)
    
    # MACD
    macd = ta.macd(df['Close'])
    if macd is not None:
        df['macd'] = macd['MACD_12_26_9']
        df['macd_signal'] = macd['MACDs_12_26_9']
        df['macd_hist'] = macd['MACDh_12_26_9']
    
    # EMAs
    df['ema_20'] = ta.ema(df['Close'], length=20)
    df['ema_50'] = ta.ema(df['Close'], length=50)
    df['ema_200'] = ta.ema(df['Close'], length=200)
    
    # Bollinger Bands
    bbands = ta.bbands(df['Close'], length=20, std=2)
    if bbands is not None:
        df['bb_upper'] = bbands['BBU_20_2.0']
        df['bb_lower'] = bbands['BBL_20_2.0']
    
    # Get last values
    last = df.iloc[-1]
    
    return {
        "price": last['Close'],
        "rsi": float(last['rsi']) if not pd.isna(last['rsi']) else None,
        "macd": float(last['macd']) if not pd.isna(last['macd']) else None,
        "macd_signal": float(last['macd_signal']) if not pd.isna(last['macd_signal']) else None,
        "ema_20": float(last['ema_20']) if not pd.isna(last['ema_20']) else None,
        "ema_50": float(last['ema_50']) if not pd.isna(last['ema_50']) else None,
        "ema_200": float(last['ema_200']) if not pd.isna(last['ema_200']) else None,
        "bb_upper": float(last['bb_upper']) if not pd.isna(last['bb_upper']) else None,
        "bb_lower": float(last['bb_lower']) if not pd.isna(last['bb_lower']) else None,
    }

def interpret_indicators(data: Dict[str, Any]) -> Dict[str, str]:
    interpretations = {}
    
    # RSI
    rsi = data.get('rsi')
    if rsi:
        if rsi > 70: interpretations['rsi'] = "SOBRECOMPRA"
        elif rsi < 30: interpretations['rsi'] = "SOBREVENTA"
        else: interpretations['rsi'] = "NEUTRAL"
        
    # Trend
    p = data.get('price')
    e20 = data.get('ema_20')
    e50 = data.get('ema_50')
    e200 = data.get('ema_200')
    
    if p and e20 and e50 and e200:
        if p > e20 > e50 > e200: interpretations['tendencia'] = "ALCISTA FUERTE"
        elif p < e20 < e50 < e200: interpretations['tendencia'] = "BAJISTA FUERTE"
        elif p > e200: interpretations['tendencia'] = "ALCISTA LARGO PLAZO"
        else: interpretations['tendencia'] = "RANGO/BAJISTA"
        
    return interpretations
