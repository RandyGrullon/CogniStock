from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class DatabaseAdapter(ABC):
    @abstractmethod
    def insert_trade(self, trade: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def get_open_trades(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def update_trade(self, trade_id: str, updates: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def insert_analysis(self, analysis: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def get_lessons(self, ticker: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def insert_lesson(self, lesson: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def get_portfolio_status(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def update_portfolio_status(self, updates: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def get_recent_analysis(self, limit: int = 10) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def insert_daily_summary(self, summary: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def get_daily_summaries(self, limit: int = 10) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def update_daily_summary(self, fecha: str, updates: Dict[str, Any]) -> None:
        pass
