import logging
import uuid
from fastapi import APIRouter, HTTPException, Request, Response

from config import MAX_SOURCE_CODE_BYTES
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
    Hardened optimization pipeline with validation, syntax checks, multi-case verification,
    median benchmarking, decision gate accept/reject, and UUID tracking.
    """
    request_id = f"opt_{uuid.uuid4().hex[:12]}"
    logger.info(f"[POST /optimize] req_id={request_id} lang='{payload.language}' bytes={len(payload.code.encode('utf-8'))}")

    # Step 1: Validate payload size
    code_bytes = len(payload.code.encode("utf-8"))
    if code_bytes > MAX_SOURCE_CODE_BYTES:
        logger.warning(f"[POST /optimize] Rejected oversized payload: {code_bytes} bytes")
        raise HTTPException(
            status_code=413,
            detail=f"Payload Too Large: Source code exceeds maximum allowed size ({MAX_SOURCE_CODE_BYTES} bytes)."
        )

    if not payload.code or not payload.code.trim():
        raise HTTPException(
            status_code=400,
            detail="Syntax Error: Source code input cannot be empty."
        )

    # Step 2: Optimize code via Groq LLM
    try:
        groq_result = await groq_optimize_code(payload.code, payload.language)
        optimized_code = groq_result["optimized_code"]
        reasoning = groq_result["reasoning"]
    except GroqOptimizationError as exc:
        logger.error(f"[POST /optimize] req_id={request_id} Groq optimization failed: {exc}")
        raise HTTPException(
            status_code=502,
            detail="The optimization service is temporarily unavailable. Please try again later."
        ) from exc
    except Exception as exc:
        logger.error(f"[POST /optimize] req_id={request_id} Unexpected AI error: {exc}")
        raise HTTPException(
            status_code=502,
            detail="Optimization service encountered an unexpected error."
        ) from exc

    # Step 3: Multi-case verification & median benchmarking
    try:
        benchmark_result = await benchmark_compare(
            original_code=payload.code,
            optimized_code=optimized_code,
            language=payload.language,
            reasoning=reasoning
        )
    except Exception as exc:
        logger.error(f"[POST /optimize] req_id={request_id} Benchmark error: {exc}")
        benchmark_result = {
            "optimized_code": optimized_code,
            "reasoning": f"{reasoning} [BENCHMARK ERROR]",
            "original_time_ms": None,
            "optimized_time_ms": None,
            "improvement_pct": None,
            "correctness_verified": False,
            "benchmark_failed": True,
        }

    is_benchmark_failed = benchmark_result.get("benchmark_failed", False)
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

    optimization_uuid = f"opt_rec_{uuid.uuid4().hex[:12]}"
    db_payload = {
        "id": optimization_uuid,
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

    # Persist log to Supabase if configured
    if supabase is not None:
        try:
            supabase.table("optimizations").insert({
                "id": optimization_uuid,
                "code": payload.code,
                "optimized_code": optimized_code,
                "language": payload.language,
                "reasoning": response_data.reasoning,
                "original_time_ms": orig_time,
                "optimized_time_ms": opt_time,
                "improvement_pct": imp_pct,
                "correctness_verified": correctness,
            }).execute()
        except Exception as exc:
            logger.warning(f"[POST /optimize] Failed to insert log to Supabase: {exc}")

    return response_data
