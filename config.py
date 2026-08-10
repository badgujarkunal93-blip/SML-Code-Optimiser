import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
PISTON_URL: str = os.getenv("PISTON_URL", "https://emkc.org/api/v2/piston").rstrip("/")
PISTON_API_KEY: str = os.getenv("PISTON_API_KEY", "")

# Security & Resource Limits
MAX_SOURCE_CODE_BYTES: int = int(os.getenv("MAX_SOURCE_CODE_BYTES", "100000"))  # 100KB
EXECUTION_TIMEOUT_SECONDS: float = float(os.getenv("EXECUTION_TIMEOUT_SECONDS", "5.0"))
MAX_EXECUTION_OUTPUT_BYTES: int = int(os.getenv("MAX_EXECUTION_OUTPUT_BYTES", "1048576"))  # 1MB
PISTON_RUNTIME_CACHE_TTL_SECONDS: int = int(os.getenv("PISTON_RUNTIME_CACHE_TTL_SECONDS", "1800"))
RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "15"))

# Benchmarking Parameters
BENCHMARK_WARMUP_RUNS: int = int(os.getenv("BENCHMARK_WARMUP_RUNS", "2"))
BENCHMARK_MEASUREMENT_RUNS: int = int(os.getenv("BENCHMARK_MEASUREMENT_RUNS", "5"))
