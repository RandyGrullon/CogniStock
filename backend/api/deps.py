import os
from fastapi import Depends
from dotenv import load_dotenv

from database.sqlite_adapter import SQLiteAdapter
from database.supabase_adapter import SupabaseAdapter
from core.analyzer import StockAnalyzer
from core.portfolio import PortfolioManager
from core.ai_client import AIClient

from memory.lessons import LessonManager

load_dotenv()

def get_db():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if supabase_url and supabase_key:
        return SupabaseAdapter(supabase_url, supabase_key)
        
    db_url = os.getenv("DATABASE_URL", "sqlite:///./stock_analyst.db")
    return SQLiteAdapter(db_url)

def get_ai_client():
    api_key = os.getenv("GROQ_API_KEY")
    return AIClient(api_key)

def get_analyzer(db=Depends(get_db), ai_client=Depends(get_ai_client)):
    return StockAnalyzer(db, ai_client)

def get_lesson_manager(db=Depends(get_db), ai_client=Depends(get_ai_client)):
    return LessonManager(db, ai_client)

def get_portfolio_manager(db=Depends(get_db), lm=Depends(get_lesson_manager)):
    return PortfolioManager(db, lm)
