"""
Piston Execution Client Service.
Executes code snippets using the Piston API in isolated sandboxes.
SECURITY MANDATE: Local Python process execution fallback is STRICTLY REMOVED.
"""

import asyncio
import logging
import time
from typing import Dict, Any, Tuple, List, Optional
import httpx

from config import (
    PISTON_URL,
    PISTON_API_KEY,
    EXECUTION_TIMEOUT_SECONDS,
    MAX_EXECUTION_OUTPUT_BYTES,
    MAX_SOURCE_CODE_BYTES,
    PISTON_RUNTIME_CACHE_TTL_SECONDS,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global cache for runtime language & version mappings with TTL
_RUNTIMES_CACHE: Dict[str, Tuple[str, str]] = {}
_RUNTIMES_CACHE_TIMESTAMP: float = 0.0

LANGUAGE_ALIASES = {
    "py": "python",
    "js": "javascript",
    "ts": "typescript",
    "cpp": "c++",
    "c++": "c++",
    "cs": "csharp",
    "rb": "ruby",
    "rs": "rust",
    "go": "go",
    "c": "c",
    "java": "java",
    "php": "php",
}

SUPPORTED_LANGUAGES_SET = {
    "python", "javascript", "typescript", "c++", "c", "java",
    "rust", "go", "csharp", "ruby", "php"
}


def _get_headers() -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if PISTON_API_KEY:
        headers["Authorization"] = PISTON_API_KEY
    return headers


async def _fetch_and_cache_runtimes() -> Dict[str, Tuple[str, str]]:
    """
    Fetches available runtimes from Piston API with TTL expiration.
    """
    global _RUNTIMES_CACHE, _RUNTIMES_CACHE_TIMESTAMP
    now = time.time()

    if _RUNTIMES_CACHE and (now - _RUNTIMES_CACHE_TIMESTAMP < PISTON_RUNTIME_CACHE_TTL_SECONDS):
        return _RUNTIMES_CACHE

    runtimes_url = f"{PISTON_URL}/runtimes"
    logger.info(f"[Piston API] Fetching runtimes from {runtimes_url}...")

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            response = await client.get(runtimes_url, headers=_get_headers())
            if response.status_code == 200:
                runtimes: List[Dict[str, Any]] = response.json()
                cache: Dict[str, Tuple[str, str]] = {}
                for item in runtimes:
                    lang = str(item.get("language", "")).lower()
                    ver = str(item.get("version", ""))
                    aliases = [str(a).lower() for a in item.get("aliases", [])]

                    for k in [lang] + aliases:
                        if k not in cache or ver > cache[k][1]:
                            cache[k] = (lang, ver)

                _RUNTIMES_CACHE = cache
                _RUNTIMES_CACHE_TIMESTAMP = now
                logger.info(f"[Piston API] Successfully cached {len(_RUNTIMES_CACHE)} runtime keys.")
                return _RUNTIMES_CACHE
    except Exception as exc:
        logger.warning(f"[Piston API Runtimes] Failed to fetch runtimes from API: {exc}")

    # Default fallback mapping
    _RUNTIMES_CACHE = {
        "python": ("python", "3.10.0"),
        "py": ("python", "3.10.0"),
        "javascript": ("javascript", "18.15.0"),
        "js": ("javascript", "18.15.0"),
        "typescript": ("typescript", "5.0.3"),
        "ts": ("typescript", "5.0.3"),
        "c++": ("c++", "10.2.0"),
        "cpp": ("c++", "10.2.0"),
        "c": ("c", "10.2.0"),
        "java": ("java", "15.0.2"),
        "rust": ("rust", "1.68.2"),
        "rs": ("rust", "1.68.2"),
        "go": ("go", "1.16.2"),
    }
    _RUNTIMES_CACHE_TIMESTAMP = now
    return _RUNTIMES_CACHE


async def resolve_language_and_version(requested_language: str) -> Optional[Tuple[str, str]]:
    """
    Resolves requested language string to canonical Piston language name and version.
    Returns None if unsupported.
    """
    clean_lang = requested_language.strip().lower()
    clean_lang = LANGUAGE_ALIASES.get(clean_lang, clean_lang)

    if clean_lang not in SUPPORTED_LANGUAGES_SET:
        return None

    runtimes = await _fetch_and_cache_runtimes()

    if clean_lang in runtimes:
        return runtimes[clean_lang]

    for key, (canonical_lang, version) in runtimes.items():
        if key.startswith(clean_lang) or clean_lang.startswith(key):
            return canonical_lang, version

    return None


def _truncate_text(text: str, max_bytes: int) -> Tuple[str, bool]:
    encoded = text.encode("utf-8")
    if len(encoded) <= max_bytes:
        return text, False
    truncated_str = encoded[:max_bytes].decode("utf-8", errors="ignore")
    return f"{truncated_str}\n...[OUTPUT TRUNCATED EXCEEDED {max_bytes} BYTES]", True


async def run_code(code: str, language: str, stdin: str = "") -> Dict[str, Any]:
    """
    Executes code snippet via isolated Piston API sandbox.
    CRITICAL SECURITY GUARANTEE: NEVER executes user-submitted code locally.
    """
    start_time = time.perf_counter()

    # Validate source code size
    code_bytes = len(code.encode("utf-8"))
    if code_bytes > MAX_SOURCE_CODE_BYTES:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Source code payload size ({code_bytes} bytes) exceeds limit ({MAX_SOURCE_CODE_BYTES} bytes).",
            "exit_code": -1,
            "time_ms": 0.0,
            "piston_time_ms": 0.0,
            "timed_out": False,
            "error_code": "SOURCE_CODE_TOO_LARGE",
            "message": "Payload Too Large",
        }

    resolved = await resolve_language_and_version(language)
    if not resolved:
        supported_str = ", ".join(sorted(list(SUPPORTED_LANGUAGES_SET)))
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Unsupported language: '{language}'. Supported languages: {supported_str}",
            "exit_code": -1,
            "time_ms": 0.0,
            "piston_time_ms": 0.0,
            "timed_out": False,
            "error_code": "UNSUPPORTED_LANGUAGE",
            "message": f"Unsupported language: '{language}'",
        }

    canonical_lang, version = resolved
    execute_url = f"{PISTON_URL}/execute"

    payload = {
        "language": canonical_lang,
        "version": version,
        "files": [{"content": code}],
        "stdin": stdin,
    }

    # Safe Metadata Logging (NEVER log user source code in production logs)
    logger.info(
        f"[Piston Client Request] Lang={canonical_lang} | Version={version} | CodeBytes={code_bytes} | StdinBytes={len(stdin)}"
    )

    try:
        async with httpx.AsyncClient(timeout=EXECUTION_TIMEOUT_SECONDS) as client:
            response = await client.post(execute_url, json=payload, headers=_get_headers())
            wall_time_ms = (time.perf_counter() - start_time) * 1000.0

            if response.status_code != 200:
                logger.warning(f"[Piston Client Response] HTTP {response.status_code}")
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": "Secure code execution service is temporarily unavailable.",
                    "exit_code": -1,
                    "time_ms": round(wall_time_ms, 2),
                    "piston_time_ms": 0.0,
                    "timed_out": False,
                    "error_code": "EXECUTION_SERVICE_UNAVAILABLE",
                    "message": "Secure code execution is temporarily unavailable.",
                }

            data = response.json()
            run_result = data.get("run", {})

            raw_stdout = str(run_result.get("stdout", "")).rstrip()
            raw_stderr = str(run_result.get("stderr", "")).rstrip()
            exit_code = int(run_result.get("code", 0) if run_result.get("code") is not None else -1)

            piston_time_sec = run_result.get("time")
            piston_time_ms = float(piston_time_sec) * 1000.0 if piston_time_sec is not None else wall_time_ms

            stdout, stdout_truncated = _truncate_text(raw_stdout, MAX_EXECUTION_OUTPUT_BYTES)
            stderr, stderr_truncated = _truncate_text(raw_stderr, MAX_EXECUTION_OUTPUT_BYTES)

            return {
                "success": exit_code == 0,
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": exit_code,
                "time_ms": round(wall_time_ms, 2),
                "piston_time_ms": round(piston_time_ms, 2),
                "timed_out": False,
                "stdout_truncated": stdout_truncated,
                "stderr_truncated": stderr_truncated,
            }

    except (httpx.TimeoutException, httpx.ReadTimeout):
        wall_time_ms = (time.perf_counter() - start_time) * 1000.0
        logger.warning(f"[Piston Client Timeout] Execution exceeded limit of {EXECUTION_TIMEOUT_SECONDS}s.")
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution exceeded the allowed time limit of {EXECUTION_TIMEOUT_SECONDS}s.",
            "exit_code": -1,
            "time_ms": round(wall_time_ms, 2),
            "piston_time_ms": 0.0,
            "timed_out": True,
            "error_code": "TIMEOUT",
            "message": "Execution exceeded the allowed time limit.",
        }

    except Exception as exc:
        wall_time_ms = (time.perf_counter() - start_time) * 1000.0
        logger.error(f"[Piston Client Exception] {type(exc).__name__}: {exc}")
        return {
            "success": False,
            "stdout": "",
            "stderr": "Secure code execution is temporarily unavailable.",
            "exit_code": -1,
            "time_ms": round(wall_time_ms, 2),
            "piston_time_ms": 0.0,
            "timed_out": False,
            "error_code": "EXECUTION_SERVICE_UNAVAILABLE",
            "message": "Secure code execution is temporarily unavailable.",
        }
