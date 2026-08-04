"""
Piston Execution Client Service.
Executes code snippets using the Piston API with real local execution fallbacks.
"""

import asyncio
import json
import logging
import subprocess
import sys
import time
import traceback
from typing import Dict, Any, Tuple, List
import httpx

from config import PISTON_URL, PISTON_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global cache for runtime language & version mappings
_RUNTIMES_CACHE: Dict[str, Tuple[str, str]] = {}

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
}


def _get_headers() -> Dict[str, str]:
    """Returns headers for Piston API calls, incorporating PISTON_API_KEY if configured."""
    headers = {"Content-Type": "application/json"}
    if PISTON_API_KEY:
        headers["Authorization"] = PISTON_API_KEY
    return headers


async def _fetch_and_cache_runtimes() -> Dict[str, Tuple[str, str]]:
    """
    Fetches available runtimes from Piston API and caches the latest version for each language and alias.
    """
    global _RUNTIMES_CACHE
    if _RUNTIMES_CACHE:
        return _RUNTIMES_CACHE

    runtimes_url = f"{PISTON_URL}/runtimes"
    logger.info(f"[Piston API] Fetching available runtimes from {runtimes_url}...")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(runtimes_url, headers=_get_headers())
            logger.info(f"[Piston API GET /runtimes] Status={response.status_code} | BodySnippet={response.text[:200]}")
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
                logger.info(f"[Piston API] Successfully cached {len(_RUNTIMES_CACHE)} language runtime keys.")
                return _RUNTIMES_CACHE
    except Exception as exc:
        logger.exception(f"[Piston API Runtimes Exception] Failed to fetch runtimes from API: {exc}")

    # Default fallback runtime versions matching Piston standard
    _RUNTIMES_CACHE = {
        "python": ("python", "3.10.0"),
        "py": ("python", "3.10.0"),
        "javascript": ("javascript", "18.15.0"),
        "js": ("javascript", "18.15.0"),
        "typescript": ("typescript", "5.0.3"),
        "ts": ("typescript", "5.0.3"),
    }
    return _RUNTIMES_CACHE


async def resolve_language_and_version(requested_language: str) -> Tuple[str, str]:
    """
    Resolves requested language string to canonical Piston language name and latest version.
    """
    clean_lang = requested_language.strip().lower()
    clean_lang = LANGUAGE_ALIASES.get(clean_lang, clean_lang)

    runtimes = await _fetch_and_cache_runtimes()

    if clean_lang in runtimes:
        return runtimes[clean_lang]

    for key, (canonical_lang, version) in runtimes.items():
        if key.startswith(clean_lang) or clean_lang.startswith(key):
            return canonical_lang, version

    return clean_lang, "*"


def _exec_python_sync(code: str) -> Dict[str, Any]:
    """
    Synchronous subprocess runner using Popen via stdin.
    Avoids Windows asyncio SelectorEventLoop NotImplementedError.
    """
    logger.info(
        f"\n==================== LOCAL EXECUTION PAYLOAD ====================\n"
        f"Runner: sys.executable ({sys.executable})\n"
        f"Code Length: {len(code)} chars\n"
        f"Code:\n{code}\n"
        f"================================================================"
    )
    start_time = time.perf_counter()
    try:
        proc = subprocess.Popen(
            [sys.executable, "-"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        stdout_str, stderr_str = proc.communicate(input=code, timeout=10.0)
        wall_time_ms = (time.perf_counter() - start_time) * 1000.0
        exit_code = proc.returncode

        logger.info(f"[Local Execution Result] ExitCode={exit_code} | Duration={wall_time_ms:.2f}ms")
        if stdout_str:
            logger.info(f"[Local Execution STDOUT]:\n{stdout_str.strip()}")
        if stderr_str:
            logger.warning(f"[Local Execution STDERR]:\n{stderr_str.strip()}")

        return {
            "stdout": stdout_str,
            "stderr": stderr_str,
            "exit_code": exit_code,
            "time_ms": round(wall_time_ms, 2),
            "piston_time_ms": round(wall_time_ms, 2),
            "timed_out": False,
        }
    except subprocess.TimeoutExpired:
        proc.kill()
        stdout_str, stderr_str = proc.communicate()
        wall_time_ms = (time.perf_counter() - start_time) * 1000.0
        logger.warning(f"[Local Execution TIMEOUT] Process timed out after {wall_time_ms:.2f} ms")
        return {
            "stdout": "",
            "stderr": "Local execution timed out after 10 seconds",
            "exit_code": -1,
            "time_ms": round(wall_time_ms, 2),
            "piston_time_ms": 0.0,
            "timed_out": True,
        }
    except Exception as exc:
        wall_time_ms = (time.perf_counter() - start_time) * 1000.0
        tb_str = traceback.format_exc()
        logger.error(f"[Local Execution EXCEPTION] {type(exc).__name__}: {exc}\n{tb_str}")
        return {
            "stdout": "",
            "stderr": f"Local execution error ({type(exc).__name__}): {exc}",
            "exit_code": -1,
            "time_ms": round(wall_time_ms, 2),
            "piston_time_ms": 0.0,
            "timed_out": False,
        }


async def _run_python_locally(code: str, stdin: str = "") -> Dict[str, Any]:
    """
    Executes Python code locally via stdin in a thread pool to support all Windows asyncio loops seamlessly.
    """
    return await asyncio.to_thread(_exec_python_sync, code)


async def run_code(code: str, language: str, stdin: str = "") -> Dict[str, Any]:
    """
    Executes code snippet via Piston API with wall-clock timing, detailed payload logging, and full exception tracebacks.
    """
    canonical_lang, version = await resolve_language_and_version(language)
    execute_url = f"{PISTON_URL}/execute"

    payload = {
        "language": canonical_lang,
        "version": version,
        "files": [{"content": code}],
        "stdin": stdin,
    }

    logger.info(
        f"\n==================== PISTON REQUEST PAYLOAD ====================\n"
        f"URL: {execute_url}\n"
        f"Language: {canonical_lang}\n"
        f"Version: {version}\n"
        f"Code:\n{code}\n"
        f"================================================================"
    )

    start_time = time.perf_counter()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(execute_url, json=payload, headers=_get_headers())
            wall_time_ms = (time.perf_counter() - start_time) * 1000.0

            logger.info(
                f"\n==================== PISTON RAW RESPONSE ====================\n"
                f"Status Code: {response.status_code}\n"
                f"Headers: {dict(response.headers)}\n"
                f"Body:\n{response.text}\n"
                f"=============================================================="
            )

            # Handle 401 Unauthorized (Piston public API whitelist restriction)
            if response.status_code == 401:
                if canonical_lang == "python":
                    logger.info("[Piston API 401] Public Piston API whitelist restricted. Triggering local Python runner...")
                    return await _run_python_locally(code, stdin)
                else:
                    return {
                        "stdout": "",
                        "stderr": f"Piston API HTTP 401 Unauthorized: {response.text}",
                        "exit_code": -1,
                        "time_ms": round(wall_time_ms, 2),
                        "piston_time_ms": 0.0,
                        "timed_out": False,
                    }

            if response.status_code != 200:
                return {
                    "stdout": "",
                    "stderr": f"Piston API HTTP error {response.status_code}: {response.text}",
                    "exit_code": -1,
                    "time_ms": round(wall_time_ms, 2),
                    "piston_time_ms": 0.0,
                    "timed_out": False,
                }

            data = response.json()
            run_result = data.get("run", {})

            stdout = str(run_result.get("stdout", ""))
            stderr = str(run_result.get("stderr", ""))
            exit_code = int(run_result.get("code", 0) if run_result.get("code") is not None else -1)

            piston_time_sec = run_result.get("time")
            piston_time_ms = float(piston_time_sec) * 1000.0 if piston_time_sec is not None else wall_time_ms

            return {
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": exit_code,
                "time_ms": round(wall_time_ms, 2),
                "piston_time_ms": round(piston_time_ms, 2),
                "timed_out": False,
            }

    except (httpx.TimeoutException, httpx.ReadTimeout) as exc:
        wall_time_ms = (time.perf_counter() - start_time) * 1000.0
        logger.warning(f"[Piston API Timeout] Request timed out after {wall_time_ms:.2f} ms: {exc}")
        return {
            "stdout": "",
            "stderr": "Execution timed out after 10 seconds",
            "exit_code": -1,
            "time_ms": round(wall_time_ms, 2),
            "piston_time_ms": 0.0,
            "timed_out": True,
        }
    except Exception as exc:
        tb_str = traceback.format_exc()
        logger.error(f"[Piston API Exception] {type(exc).__name__}: {exc}\n{tb_str}")

        if canonical_lang == "python":
            logger.info("[Piston API Exception] Triggering local Python runner fallback...")
            return await _run_python_locally(code, stdin)

        wall_time_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "stdout": "",
            "stderr": f"Execution error ({type(exc).__name__}): {exc}",
            "exit_code": -1,
            "time_ms": round(wall_time_ms, 2),
            "piston_time_ms": 0.0,
            "timed_out": False,
        }
