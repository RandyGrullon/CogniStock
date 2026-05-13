from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..deps import get_ai_client, get_db
import uuid
from datetime import datetime

router = APIRouter()

class ChatMessage(BaseModel):
    message: str
    session_id: str
    history: List[Dict[str, str]] = []

@router.post("/message")
async def chat_with_ai(
    request: ChatMessage, 
    ai_client = Depends(get_ai_client),
    db = Depends(get_db)
):
    try:
        # 1. Get Context
        portfolio = db.get_portfolio_status()
        lessons = db.get_lessons(limit=5)
        open_trades = db.get_open_trades()
        
        # 2. Build professional context
        context_summary = f"""
        SISTEMA COGNISTOCK - ESTADO ACTUAL:
        - Patrimonio Neto: ${portfolio.get('capital_total', 0):,.2f}
        - Efectivo: ${portfolio.get('capital_disponible', 0):,.2f}
        - Posiciones Abiertas: {len(open_trades)} tickers
        """
        
        system_prompt = f"""
        {context_summary}
        Eres 'CogniStock AI', el núcleo de inteligencia de esta terminal de trading.
        Responde basándote en los datos REALES. Tu tono es ejecutivo y directo.
        """
        
        # 3. Format history strictly for Groq (only system, user, assistant roles)
        formatted_messages = [{"role": "system", "content": system_prompt}]
        
        for msg in request.history:
            # Map any role from frontend to Groq compatible roles
            role = "assistant" if msg['role'].lower() in ["assistant", "ai", "bot"] else "user"
            formatted_messages.append({"role": role, "content": msg['content']})
            
        # Add current user message
        formatted_messages.append({"role": "user", "content": request.message})
        
        print(f"DEBUG - Messages sent to Groq: {formatted_messages}")
        
        # 4. Get response from AIClient
        # Directly call Groq here for better error catching
        chat_completion = ai_client.client.chat.completions.create(
            messages=formatted_messages,
            model=ai_client.model,
            temperature=0.7,
        )
        
        response_text = chat_completion.choices[0].message.content
        return {"response": response_text}
        
    except Exception as e:
        print(f"CRITICAL CHAT ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {"response": f"Error de enlace: {str(e)}"}

@router.post("/end-session")
async def end_session(
    request: Dict[str, Any],
    ai_client = Depends(get_ai_client),
    db = Depends(get_db)
):
    session_id = request.get("session_id")
    history = request.get("history", [])
    
    print(f"DEBUG - Intentando cerrar sesión: {session_id} con {len(history)} mensajes")
    
    if len(history) < 2: 
        print("DEBUG - Sesión demasiado corta para loggear.")
        return {"status": "empty"}

    summary_prompt = f"""
    Eres un analista de sistemas experto. Resume esta sesión de trading entre el usuario y la IA CogniStock.
    HISTORIAL DE CONVERSACIÓN:
    {str(history)}
    
    Genera un JSON con este formato exacto:
    {{
        "ticker": "CHAT",
        "recomendacion": "SUMMARY",
        "confianza": 100,
        "nivel_riesgo": "N/A",
        "razonamiento": "Resumen detallado de los puntos clave discutidos y consejos dados...",
        "riesgos": ["temas de riesgo discutidos"]
    }}
    """
    
    try:
        chat_completion = ai_client.client.chat.completions.create(
            messages=[{"role": "user", "content": summary_prompt}],
            model=ai_client.model,
            response_format={"type": "json_object"}
        )
        
        import json
        summary_data = json.loads(chat_completion.choices[0].message.content)
        
        log_entry = {
            "id": str(uuid.uuid4()),
            "ticker": "CHAT",
            "fecha": datetime.now().isoformat(),
            "recomendacion": summary_data.get("recomendacion", "SUMMARY"),
            "confianza": 100,
            "nivel_riesgo": "N/A",
            "razonamiento": summary_data.get("razonamiento", "Chat Session"),
            "riesgos": summary_data.get("riesgos", []),
            "datos_tecnicos": "Reporte de Sesión Neural",
            "datos_fundamentales": f"ID de Sesión: {session_id}"
        }
        
        # Format risks for DB
        if isinstance(log_entry['riesgos'], list):
            log_entry['riesgos'] = ", ".join(log_entry['riesgos'])
            
        print(f"DEBUG - Guardando log de sesión en DB: {log_entry['id']}")
        db.insert_analysis(log_entry)
        
        # Also save to dedicated table if exists
        try:
            db.supabase.table("chat_sessions").insert({
                "session_id": session_id,
                "history": history,
                "resumen": log_entry["razonamiento"]
            }).execute()
        except:
            pass # Table might not exist yet
            
        return {"status": "logged", "id": log_entry["id"]}
    except Exception as e:
        print(f"ERROR al loggear sesión: {e}")
        return {"status": "error", "detail": str(e)}
