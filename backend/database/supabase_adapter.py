import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from database.adapter import DatabaseAdapter

class SupabaseAdapter(DatabaseAdapter):
    def __init__(self, url: str, key: str):
        self.supabase: Client = create_client(url, key)

    def insert_trade(self, trade: Dict[str, Any]) -> None:
        self.supabase.table("trades").insert(trade).execute()

    def get_open_trades(self) -> List[Dict[str, Any]]:
        response = self.supabase.table("trades").select("*").eq("estado", "OPEN").execute()
        return response.data

    def update_trade(self, trade_id: str, updates: Dict[str, Any]) -> None:
        self.supabase.table("trades").update(updates).eq("id", trade_id).execute()

    def insert_analysis(self, analysis: Dict[str, Any]) -> None:
        self.supabase.table("analisis").insert(analysis).execute()

    def get_lessons(self, ticker: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        query = self.supabase.table("lecciones").select("*").order("fecha", desc=True).limit(limit)
        if ticker:
            # Using overlapping or similar for tags if needed, for now simple filter
            query = query.filter("tags", "cs", f"{{{ticker}}}") 
        response = query.execute()
        return response.data

    def insert_lesson(self, lesson: Dict[str, Any]) -> None:
        self.supabase.table("lecciones").insert(lesson).execute()

    def get_portfolio_status(self) -> Dict[str, Any]:
        response = self.supabase.table("portafolio").select("*").eq("id", 1).execute()
        if response.data:
            return response.data[0]
        return {}

    def update_portfolio_status(self, updates: Dict[str, Any]) -> None:
        self.supabase.table("portafolio").update(updates).eq("id", 1).execute()

    def get_recent_analysis(self, limit: int = 10) -> List[Dict[str, Any]]:
        response = self.supabase.table("analisis").select("*").order("fecha", desc=True).limit(limit).execute()
        return response.data

    def insert_daily_summary(self, summary: Dict[str, Any]) -> None:
        self.supabase.table("daily_summaries").insert(summary).execute()

    def get_daily_summaries(self, limit: int = 10) -> List[Dict[str, Any]]:
        response = self.supabase.table("daily_summaries").select("*").order("fecha", desc=True).limit(limit).execute()
        return response.data

    def update_daily_summary(self, fecha: str, updates: Dict[str, Any]) -> None:
        self.supabase.table("daily_summaries").update(updates).eq("fecha", fecha).execute()
