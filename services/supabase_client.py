"""
Supabase Client Initialization Service.
"""
from typing import Optional
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY


def get_supabase_client() -> Optional[Client]:
    """
    Initialize and return Supabase client using environment configuration.
    Returns None if environment variables are not configured or invalid.
    """
    if not SUPABASE_URL or not SUPABASE_KEY or "your_supabase" in SUPABASE_URL.lower():
        return None
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception:
        return None


supabase: Optional[Client] = get_supabase_client()
