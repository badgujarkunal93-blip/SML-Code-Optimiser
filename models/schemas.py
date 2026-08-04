from typing import Optional, List
from pydantic import BaseModel


class OptimizeRequest(BaseModel):
    code: str
    language: str


class OptimizeResponse(BaseModel):
    optimized_code: str
    reasoning: str
    original_time_ms: Optional[float] = None
    optimized_time_ms: Optional[float] = None
    improvement_pct: Optional[float] = None
    correctness_verified: bool = False
    benchmark_failed: bool = False


class HistoryItem(BaseModel):
    id: Optional[str] = None
    created_at: Optional[str] = None
    code: str
    language: str
    optimized_code: str
    reasoning: Optional[str] = None
    original_time_ms: Optional[float] = None
    optimized_time_ms: Optional[float] = None
    improvement_pct: Optional[float] = None
    correctness_verified: bool = False
