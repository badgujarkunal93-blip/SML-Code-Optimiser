import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter

from models.schemas import HistoryItem
from services.supabase_client import supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["History"])

# In-memory history cache for demo mode (when Supabase is unconfigured)
in_memory_history: List[Dict[str, Any]] = []


@router.get("", response_model=List[HistoryItem])
async def get_history() -> List[Dict[str, Any]]:
    """
    GET /history endpoint.
    Retrieves the last 50 optimizations from Supabase, or falls back to in-memory history if Supabase is unconfigured.
    """
    if supabase is not None:
        try:
            response = (
                supabase.table("optimizations")
                .select("*")
                .order("created_at", desc=True)
                .limit(50)
                .execute()
            )
            if response.data:
                logger.info(f"[GET /history] Retrieved {len(response.data)} rows from Supabase.")
                return response.data
        except Exception as exc:
            logger.warning(f"[GET /history] Supabase query skipped/failed ({exc}). Using in-memory fallback.")

    logger.info(f"[GET /history] Returning {len(in_memory_history)} in-memory history items.")
    return in_memory_history[:50]
