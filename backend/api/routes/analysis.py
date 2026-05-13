from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from ..deps import get_db

router = APIRouter()

@router.get("/recent")
async def get_recent_analysis(db = Depends(get_db)):
    try:
        # Get last 10 analyses from DB
        response = db.supabase.table("analisis").select("*").order("fecha", desc=True).limit(10).execute()
        return response.data
    except Exception as e:
        # Fallback for SQLite or errors
        return []
