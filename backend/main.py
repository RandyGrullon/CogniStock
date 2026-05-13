import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .database.sqlite_adapter import SQLiteAdapter
from .core.analyzer import StockAnalyzer
from .core.portfolio import PortfolioManager

load_dotenv()

app = FastAPI(title="AI Stock Analyst API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency Injection
from .api.deps import get_db, get_ai_client, get_analyzer, get_portfolio_manager, get_lesson_manager

# Routes
from .api.routes import analysis, portfolio, chat
from .core.scheduler import MarketScheduler

app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.on_event("startup")
async def startup_event():
    db = get_db()
    ai_client = get_ai_client()
    analyzer = get_analyzer(db, ai_client)
    lesson_mgr = get_lesson_manager(db, ai_client)
    portfolio_mgr = get_portfolio_manager(db, lesson_mgr)
    
    scheduler = MarketScheduler(db, analyzer, portfolio_mgr)
    scheduler.start()
    print("Market Scheduler iniciado.")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "environment": os.getenv("ENVIRONMENT", "local")}
