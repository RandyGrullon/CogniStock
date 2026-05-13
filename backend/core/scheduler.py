import os
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from .analyzer import StockAnalyzer
from .portfolio import PortfolioManager
from ..database.adapter import DatabaseAdapter

class MarketScheduler:
    def __init__(self, db: DatabaseAdapter, analyzer: StockAnalyzer, portfolio: PortfolioManager):
        self.db = db
        self.analyzer = analyzer
        self.portfolio = portfolio
        self.scheduler = AsyncIOScheduler()
        self.tickers = os.getenv("TICKERS_MONITOREADOS", "TSLA,NVDA,AAPL,MSFT,META,AMZN,AMD,GOOGL").split(",")

    def start(self):
        # 8:30am ET - Pre-mercado
        self.scheduler.add_job(
            self.run_scheduled_analysis,
            'cron',
            day_of_week='mon-fri',
            hour=8,
            minute=30,
            timezone='US/Eastern',
            id='pre_market_analysis'
        )

        # 9:35am ET - Apertura
        self.scheduler.add_job(
            self.run_scheduled_analysis,
            'cron',
            day_of_week='mon-fri',
            hour=9,
            minute=35,
            timezone='US/Eastern',
            id='open_market_analysis'
        )

        # 3:50pm ET - Cierre
        self.scheduler.add_job(
            self.run_scheduled_analysis,
            'cron',
            day_of_week='mon-fri',
            hour=15,
            minute=50,
            timezone='US/Eastern',
            id='close_market_analysis'
        )

        # Actualizar P&L cada 15 min durante el mercado
        self.scheduler.add_job(
            self.portfolio.update_portfolio_values,
            'cron',
            day_of_week='mon-fri',
            hour='9-16',
            minute='*/15',
            timezone='US/Eastern',
            id='update_pnl'
        )

        # Modo Demo: Análisis cada 5 minutos para que el usuario vea la actividad
        self.scheduler.add_job(
            self.run_scheduled_analysis,
            'interval',
            minutes=5,
            id='demo_market_analysis'
        )

        self.scheduler.start()

    async def run_scheduled_analysis(self):
        print(f"Iniciando análisis programado para: {self.tickers}")
        for ticker in self.tickers:
            try:
                analysis = self.analyzer.analyze_ticker(ticker)
                
                # Lógica automática de trade si la confianza es alta
                confianza_minima = int(os.getenv("CONFIANZA_MINIMA_PARA_TRADE", 70))
                if analysis['recomendacion'] == 'BUY' and analysis['confianza'] >= confianza_minima:
                    # Determinar cantidad basada en capital (ej: 2% del capital total)
                    status = self.db.get_portfolio_status()
                    if status:
                        capital_total = status['capital_total']
                        amount_to_invest = capital_total * 0.02
                        price = analysis.get('precio_actual', 0) # We might need to ensure this is in analysis
                        if price > 0:
                            shares = int(amount_to_invest / price)
                            if shares > 0:
                                self.portfolio.execute_trade(
                                    ticker=ticker,
                                    side="BUY",
                                    amount=shares,
                                    reasoning=f"Auto-trade programado: {analysis['razonamiento']}"
                                )
            except Exception as e:
                print(f"Error analizando {ticker}: {e}")
