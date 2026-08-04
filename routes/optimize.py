import logging
from fastapi import APIRouter, HTTPException

from models.schemas import OptimizeRequest, OptimizeResponse
from services.groq_client import optimize_code as groq_optimize_code, GroqOptimizationError
from services.benchmark import compare as benchmark_compare
from routes.history import in_memory_history
from services.supabase_client import supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/optimize", tags=["Optimize"])


@router.post("", response_model=OptimizeResponse)
async def optimize_code_endpoint(payload: OptimizeRequest):
    """
    POST /optimize endpoint.
    Optimizes source code using Groq LLM, benchmarks execution performance via Piston,
    and logs optimization records into Supabase.
    """
    logger.info(f"[POST /optimize] Received optimization request for language='{payload.language}'")

    # Step 1: Optimize code via Groq LLM
    try:
        groq_result = await groq_optimize_code(payload.code, payload.language)
        optimized_code = groq_result["optimized_code"]
        reasoning = groq_result["reasoning"]
    except GroqOptimizationError as exc:
        logger.error(f"[POST /optimize] Groq optimization failed: {exc}")
        raise HTTPException(
            status_code=502,
            detail=f"Groq code optimization service failed: {exc}"
        ) from exc
    except Exception as exc:
        logger.error(f"[POST /optimize] Unexpected error during Groq optimization: {exc}")
        raise HTTPException(
            status_code=502,
            detail=f"Groq service error: {exc}"
        ) from exc

    # Step 2: Benchmark original vs optimized code
    try:
        benchmark_result = await benchmark_compare(
            original_code=payload.code,
            optimized_code=optimized_code,
            language=payload.language,
            reasoning=reasoning
        )
    except Exception as exc:
        logger.error(f"[POST /optimize] Benchmark comparison encountered error: {exc}")
        benchmark_result = {
            "optimized_code": optimized_code,
            "reasoning": f"{reasoning} [BENCHMARK FAILED: {exc}]",
            "original_time_ms": None,
            "optimized_time_ms": None,
            "improvement_pct": None,
            "correctness_verified": False,
            "benchmark_failed": True,
        }

    # Check for Piston timeout in reasoning or metrics
    is_benchmark_failed = benchmark_result.get("benchmark_failed", False)
    if "timed out" in benchmark_result.get("reasoning", "").lower():
        is_benchmark_failed = True

    if is_benchmark_failed:
        orig_time = None
        opt_time = None
        imp_pct = None
        correctness = False
    else:
        orig_time = benchmark_result.get("original_time_ms")
        opt_time = benchmark_result.get("optimized_time_ms")
        imp_pct = benchmark_result.get("improvement_pct")
        correctness = benchmark_result.get("correctness_verified", False)

    response_data = OptimizeResponse(
        optimized_code=optimized_code,
        reasoning=benchmark_result.get("reasoning", reasoning),
        original_time_ms=orig_time,
        optimized_time_ms=opt_time,
        improvement_pct=imp_pct,
        correctness_verified=correctness,
        benchmark_failed=is_benchmark_failed,
    )

    db_payload = {
        "id": f"demo-{len(in_memory_history)+1}",
        "code": payload.code,
        "optimized_code": optimized_code,
        "language": payload.language,
        "reasoning": response_data.reasoning,
        "original_time_ms": orig_time,
        "optimized_time_ms": opt_time,
        "improvement_pct": imp_pct,
        "correctness_verified": correctness,
    }
    in_memory_history.insert(0, db_payload)

    # Step 3: Fire-and-log into Supabase optimizations table
    if supabase is not None:
        try:
            supabase.table("optimizations").insert({
                "code": payload.code,
                "optimized_code": optimized_code,
                "language": payload.language,
                "reasoning": response_data.reasoning,
                "original_time_ms": orig_time,
                "optimized_time_ms": opt_time,
                "improvement_pct": imp_pct,
                "correctness_verified": correctness,
            }).execute()
            logger.info("[POST /optimize] Successfully logged optimization to Supabase.")
        except Exception as exc:
            logger.error(f"[POST /optimize] Failed to insert log to Supabase: {exc}")

    return response_data
