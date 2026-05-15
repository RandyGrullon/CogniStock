from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from api.deps import get_db, get_ai_client
from datetime import datetime
import uuid
import uuid

router = APIRouter()

@router.get("/daily-summaries")
async def get_daily_summaries(limit: int = 10, db = Depends(get_db)):
    try:
        return db.get_daily_summaries(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/lessons")
async def get_lessons(ticker: str = None, limit: int = 20, db = Depends(get_db)):
    try:
        return db.get_lessons(ticker=ticker, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start-day")
async def start_day(db = Depends(get_db), ai_client = Depends(get_ai_client)):
    """AI sets goals and intention for the day based on market conditions."""
    fecha_hoy = datetime.now().strftime('%Y-%m-%d')
    
    # Check if already started
    existing = db.get_daily_summaries(limit=1)
    if existing and existing[0]['fecha'] == fecha_hoy:
        return existing[0]

    # Get portfolio context
    portfolio = db.get_portfolio_status()
    lessons = db.get_lessons(limit=10)
    
    prompt = f"""
    SISTEMA COGNISTOCK - INICIO DE JORNADA
    Estado: {portfolio}
    Lecciones recientes: {lessons}
    
    Genera la intención del día y objetivos operativos.
    Responde estrictamente en formato JSON:
    {{
        "intencion": "Una frase poderosa sobre la postura de hoy (ej: Defensiva, Agresiva en Tech...)",
        "objetivos": ["objetivo 1", "objetivo 2", "objetivo 3"]
    }}
    """
    
    try:
        response = ai_client.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=ai_client.model,
            response_format={"type": "json_object"}
        )
        
        data = json.loads(response.choices[0].message.content)
        
        summary = {
            "id": str(uuid.uuid4()),
            "fecha": fecha_hoy,
            "intencion": data["intencion"],
            "objetivos": str(data["objetivos"]),
            "resultado": "",
            "obstaculos": "",
            "lecciones": "",
            "estado": "PENDING"
        }
        
        db.insert_daily_summary(summary)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/close-day")
async def close_day(db = Depends(get_db), ai_client = Depends(get_ai_client)):
    """AI reviews the day, results, obstacles and extracts a final lesson."""
    fecha_hoy = datetime.now().strftime('%Y-%m-%d')
    
    # Get today's summary
    existing = db.get_daily_summaries(limit=5)
    today_summary = next((s for s in existing if s['fecha'] == fecha_hoy), None)
    
    if not today_summary:
        raise HTTPException(status_code=404, detail="No se encontró intención de apertura para hoy.")
    
    if today_summary['estado'] == 'COMPLETED':
        return today_summary

    # Get day's activity
    trades = db.get_recent_analysis(limit=20) # Assuming recent analysis reflects activity
    portfolio = db.get_portfolio_status()
    
    prompt = f"""
    SISTEMA COGNISTOCK - CIERRE DE JORNADA
    Plan Inicial: {today_summary['intencion']}
    Objetivos: {today_summary['objetivos']}
    Actividad detectada: {trades}
    Estado Final Cartera: {portfolio}
    
    Analiza qué se logró, qué lo impidió y qué aprendiste hoy.
    Responde estrictamente en formato JSON:
    {{
        "resultado": "Resumen de logros...",
        "obstaculos": "Qué falló o impidió los objetivos...",
        "lecciones": "Lección maestra del día para no repetir errores."
    }}
    """
    
    try:
        response = ai_client.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=ai_client.model,
            response_format={"type": "json_object"}
        )
        
        data = json.loads(response.choices[0].message.content)
        
        updates = {
            "resultado": data["resultado"],
            "obstaculos": data["obstaculos"],
            "lecciones": data["lecciones"],
            "estado": "COMPLETED"
        }
        
        db.update_daily_summary(fecha_hoy, updates)
        return {**today_summary, **updates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
