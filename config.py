import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
PISTON_URL: str = os.getenv("PISTON_URL", "https://emkc.org/api/v2/piston").rstrip("/")
PISTON_API_KEY: str = os.getenv("PISTON_API_KEY", "")
