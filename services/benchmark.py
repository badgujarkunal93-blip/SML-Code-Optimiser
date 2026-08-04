"""
Benchmark Service.
Compares performance and output correctness between original and optimized code snippets.
"""

import asyncio
import logging
from typing import Dict, Any

from services.piston_client import run_code

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _extract_execution_time(res: Dict[str, Any]) -> float:
    """
    Extracts the best execution time measurement (Piston time if > 0, else wall clock time).
    """
    piston_time = res.get("piston_time_ms", 0.0)
    if piston_time > 0:
        return float(piston_time)
    return float(res.get("time_ms", 0.0))


async def compare(
    original_code: str,
    optimized_code: str,
    language: str,
    reasoning: str = ""
) -> Dict[str, Any]:
    """
    Runs original and optimized code in parallel via Piston API, verifies stdout correctness,
    measures execution times, and calculates percentage performance improvement.

    Args:
        original_code: The input code snippet before optimization.
        optimized_code: The candidate optimized code snippet.
        language: Programming language name or alias.
        reasoning: Explanation text accompanying the optimization.

    Returns:
        Dict matching OptimizeResponse fields:
            - 'optimized_code': str
            - 'reasoning': str
            - 'original_time_ms': float
            - 'optimized_time_ms': float
            - 'improvement_pct': float
            - 'correctness_verified': bool
    """
    logger.info(f"[Benchmark] Running benchmark comparison for language={language}...")

    # Execute both original and optimized snippets concurrently
    original_res, optimized_res = await asyncio.gather(
        run_code(original_code, language),
        run_code(optimized_code, language)
    )

    orig_stdout = original_res.get("stdout", "").rstrip()
    opt_stdout = optimized_res.get("stdout", "").rstrip()

    orig_exit = original_res.get("exit_code", -1)
    opt_exit = optimized_res.get("exit_code", -1)

    # Output correctness verification logic
    is_correct = True
    correctness_notes = []

    if orig_exit != 0:
        is_correct = False
        correctness_notes.append(f"Original code exited with error code {orig_exit} (stderr: {original_res.get('stderr')})")

    if opt_exit != 0:
        is_correct = False
        correctness_notes.append(f"Optimized code exited with error code {opt_exit} (stderr: {optimized_res.get('stderr')})")

    if orig_exit == 0 and opt_exit == 0 and orig_stdout != opt_stdout:
        is_correct = False
        correctness_notes.append("Output mismatch between original and optimized code.")
        logger.warning(
            f"[Benchmark] Output Mismatch!\n"
            f"Original stdout: {repr(orig_stdout)}\n"
            f"Optimized stdout: {repr(opt_stdout)}"
        )

    orig_time_ms = _extract_execution_time(original_res)
    opt_time_ms = _extract_execution_time(optimized_res)

    # Compute improvement percentage: (orig - opt) / orig * 100
    if orig_time_ms > 0:
        improvement_pct = ((orig_time_ms - opt_time_ms) / orig_time_ms) * 100.0
    else:
        improvement_pct = 0.0

    final_reasoning = reasoning
    if correctness_notes:
        logger.warning(f"[Benchmark Verification Notes]: {' | '.join(correctness_notes)}")

    return {
        "optimized_code": optimized_code,
        "reasoning": final_reasoning,
        "original_time_ms": round(orig_time_ms, 2),
        "optimized_time_ms": round(opt_time_ms, 2),
        "improvement_pct": round(improvement_pct, 2),
        "correctness_verified": is_correct,
    }
