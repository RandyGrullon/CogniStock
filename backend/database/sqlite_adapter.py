import json
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine, Column, String, Integer, Float, Text, MetaData, Table, select, update, insert
from database.adapter import DatabaseAdapter

class SQLiteAdapter(DatabaseAdapter):
    def __init__(self, db_url: str):
        self.engine = create_engine(db_url)
        self.metadata = MetaData()
        
        self.trades = Table(
            'trades', self.metadata,
            Column('id', String, primary_key=True),
            Column('ticker', String, nullable=False),
            Column('tipo', String),
            Column('acciones', Float),
            Column('precio_entrada', Float),
            Column('precio_actual', Float),
            Column('precio_salida', Float),
            Column('fecha_entrada', String),
            Column('fecha_salida', String),
            Column('razonamiento', Text),
            Column('analisis_tecnico', Text),
            Column('estado', String),
            Column('pnl', Float, default=0.0),
            Column('pnl_porcentaje', Float, default=0.0),
            Column('leccion_generada', Integer, default=0)
        )
        
        self.analisis = Table(
            'analisis', self.metadata,
            Column('id', String, primary_key=True),
            Column('ticker', String, nullable=False),
            Column('fecha', String),
            Column('recomendacion', String),
            Column('confianza', Integer),
            Column('nivel_riesgo', String),
            Column('razonamiento', Text),
            Column('riesgos', Text),
            Column('precio_objetivo', Float),
            Column('stop_loss', Float),
            Column('horizonte', String),
            Column('datos_tecnicos', Text),
            Column('datos_fundamentales', Text)
        )
        
        self.lecciones = Table(
            'lecciones', self.metadata,
            Column('id', String, primary_key=True),
            Column('trade_id', String),
            Column('ticker', String),
            Column('tipo', String),
            Column('titulo', String),
            Column('leccion', Text),
            Column('tags', Text),
            Column('patron', String),
            Column('aplicar_cuando', Text),
            Column('estrellas', Integer),
            Column('fecha', String),
            Column('veces_aplicada', Integer, default=0)
        )
        
        self.portafolio = Table(
            'portafolio', self.metadata,
            Column('id', Integer, primary_key=True, default=1),
            Column('capital_inicial', Float, default=100000.0),
            Column('capital_disponible', Float, default=100000.0),
            Column('valor_posiciones', Float, default=0.0),
            Column('capital_total', Float, default=100000.0),
            Column('total_trades', Integer, default=0),
            Column('trades_ganadores', Integer, default=0),
            Column('trades_perdedores', Integer, default=0),
            Column('mejor_trade_pnl', Float, default=0.0),
            Column('peor_trade_pnl', Float, default=0.0),
            Column('ultima_actualizacion', String)
        )

        self.daily_summaries = Table(
            'daily_summaries', self.metadata,
            Column('id', String, primary_key=True),
            Column('fecha', String, nullable=False, unique=True),
            Column('intencion', Text),
            Column('objetivos', Text),
            Column('resultado', Text),
            Column('obstaculos', Text),
            Column('lecciones', Text),
            Column('estado', String)
        )
        
        self.metadata.create_all(self.engine)

    def insert_trade(self, trade: Dict[str, Any]) -> None:
        with self.engine.connect() as conn:
            conn.execute(insert(self.trades).values(**trade))
            conn.commit()

    def get_open_trades(self) -> List[Dict[str, Any]]:
        with self.engine.connect() as conn:
            result = conn.execute(select(self.trades).where(self.trades.c.estado == 'OPEN'))
            return [dict(row._asdict()) for row in result]

    def update_trade(self, trade_id: str, updates: Dict[str, Any]) -> None:
        with self.engine.connect() as conn:
            conn.execute(update(self.trades).where(self.trades.c.id == trade_id).values(**updates))
            conn.commit()

    def insert_analysis(self, analysis: Dict[str, Any]) -> None:
        with self.engine.connect() as conn:
            conn.execute(insert(self.analisis).values(**analysis))
            conn.commit()

    def get_lessons(self, ticker: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        with self.engine.connect() as conn:
            query = select(self.lecciones)
            if ticker:
                query = query.where(self.lecciones.c.tags.like(f'%{ticker}%'))
            query = query.order_by(self.lecciones.c.fecha.desc()).limit(limit)
            result = conn.execute(query)
            return [dict(row._asdict()) for row in result]

    def insert_lesson(self, lesson: Dict[str, Any]) -> None:
        with self.engine.connect() as conn:
            conn.execute(insert(self.lecciones).values(**lesson))
            conn.commit()

    def get_portfolio_status(self) -> Dict[str, Any]:
        with self.engine.connect() as conn:
            result = conn.execute(select(self.portafolio).where(self.portafolio.c.id == 1))
            row = result.fetchone()
            if row:
                return dict(row._asdict())
            return {}

    def update_portfolio_status(self, updates: Dict[str, Any]) -> None:
        with self.engine.connect() as conn:
            # Check if exists
            result = conn.execute(select(self.portafolio).where(self.portafolio.c.id == 1))
            if not result.fetchone():
                conn.execute(insert(self.portafolio).values(id=1, **updates))
            else:
                conn.execute(update(self.portafolio).where(self.portafolio.c.id == 1).values(**updates))
            conn.commit()

    def get_recent_analysis(self, limit: int = 10) -> List[Dict[str, Any]]:
        with self.engine.connect() as conn:
            query = select(self.analisis).order_by(self.analisis.c.fecha.desc()).limit(limit)
            result = conn.execute(query)
            return [dict(row._asdict()) for row in result]

    def insert_daily_summary(self, summary: Dict[str, Any]) -> None:
        with self.engine.connect() as conn:
            conn.execute(insert(self.daily_summaries).values(**summary))
            conn.commit()

    def get_daily_summaries(self, limit: int = 10) -> List[Dict[str, Any]]:
        with self.engine.connect() as conn:
            query = select(self.daily_summaries).order_by(self.daily_summaries.c.fecha.desc()).limit(limit)
            result = conn.execute(query)
            return [dict(row._asdict()) for row in result]

    def update_daily_summary(self, fecha: str, updates: Dict[str, Any]) -> None:
        with self.engine.connect() as conn:
            conn.execute(update(self.daily_summaries).where(self.daily_summaries.c.fecha == fecha).values(**updates))
            conn.commit()
