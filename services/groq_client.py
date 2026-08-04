"""
Groq LLM Client Service.
Provides code optimization using Groq's llama-3.3-70b-versatile model.
"""

import json
import logging
import re
import time
from typing import Dict, Any

from groq import AsyncGroq
from config import GROQ_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GroqOptimizationError(Exception):
    """Custom exception raised when code optimization via Groq API fails."""
    pass


def _strip_markdown_fences(text: str) -> str:
    """
    Strips leading and trailing markdown code fences (e.g., ```python ... ``` or ```json ... ```)
    from a string if present.
    """
    text = text.strip()
    pattern = r"^```(?:[a-zA-Z0-9_+-]*\n)?([\s\S]*?)\n?```$"
    match = re.match(pattern, text)
    if match:
        return match.group(1).strip()
    return text


def _parse_json_response(raw_content: str) -> Dict[str, str]:
    """
    Extracts and parses JSON object from raw response content.
    Handles raw JSON, markdown-wrapped JSON, and regex fallback.
    """
    cleaned = _strip_markdown_fences(raw_content)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", raw_content)
        if match:
            try:
                data = json.loads(match.group(0))
            except json.JSONDecodeError as exc:
                raise ValueError(f"Failed to parse JSON response: {exc}") from exc
        else:
            raise ValueError("No JSON object found in response")

    if not isinstance(data, dict):
        raise ValueError("JSON response is not a dictionary")

    if "optimized_code" not in data or "reasoning" not in data:
        raise ValueError("JSON response missing required keys 'optimized_code' or 'reasoning'")

    # Clean any markdown code fences inside optimized_code
    data["optimized_code"] = _strip_markdown_fences(str(data["optimized_code"]))
    data["reasoning"] = str(data["reasoning"]).strip()

    return data


SYSTEM_PROMPT = (
    "You are an expert software performance engineer.\n"
    "Your task is to analyze code for performance bottlenecks and optimize it.\n\n"
    "Rules:\n"
    "1. Analyze the given code for performance bottlenecks.\n"
    "2. Return an optimized version that is functionally IDENTICAL in behavior, input handling, and output.\n"
    "3. Provide a concise reasoning (2-4 sentences) explaining what was changed and why it is faster.\n"
    "4. Output MUST strictly be a JSON object with exactly two keys: 'optimized_code' and 'reasoning'."
)

STRICT_RETRY_SYSTEM_PROMPT = (
    "You are a JSON-only response bot.\n"
    "You MUST return ONLY a valid raw JSON object with keys 'optimized_code' and 'reasoning'.\n"
    "Do NOT include markdown formatting, code fences (```json), or any text outside the JSON object."
)


async def optimize_code(code: str, language: str) -> Dict[str, str]:
    """
    Optimizes code snippet using Groq's llama-3.3-70b-versatile model.

    Args:
        code: Source code string to optimize.
        language: Programming language name (e.g., 'python', 'javascript').

    Returns:
        Dict with keys:
            - 'optimized_code': string containing optimized code
            - 'reasoning': 2-4 sentence explanation

    Raises:
        GroqOptimizationError: If optimization fails after retries or API errors occur.
    """
    if not GROQ_API_KEY:
        raise GroqOptimizationError("GROQ_API_KEY is not configured in environment.")

    client = AsyncGroq(api_key=GROQ_API_KEY)
    user_prompt = (
        f"Language: {language}\n\n"
        f"Original Code:\n{code}\n\n"
        "Return the JSON response with 'optimized_code' and 'reasoning'."
    )

    attempts = [
        {"system": SYSTEM_PROMPT, "user": user_prompt},
        {
            "system": STRICT_RETRY_SYSTEM_PROMPT,
            "user": (
                f"Language: {language}\n\n"
                f"Original Code:\n{code}\n\n"
                "Return ONLY a JSON object: {\"optimized_code\": \"...\", \"reasoning\": \"...\"}"
            )
        }
    ]

    last_error: Exception = None

    for attempt_idx, prompt_config in enumerate(attempts, start=1):
        start_time = time.perf_counter()
        logger.info(f"[Groq API] Attempt {attempt_idx}/2 initiating call for language={language}...")
        try:
            response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": prompt_config["system"]},
                    {"role": "user", "content": prompt_config["user"]}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_completion_tokens=2048,
            )
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            logger.info(f"[Groq API] Attempt {attempt_idx}/2 completed in {elapsed_ms:.2f} ms")

            content = response.choices[0].message.content or ""
            parsed_data = _parse_json_response(content)
            return parsed_data

        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            logger.warning(
                f"[Groq API] Attempt {attempt_idx}/2 failed in {elapsed_ms:.2f} ms with error: {exc}"
            )
            last_error = exc

    raise GroqOptimizationError(
        f"Groq code optimization failed after 2 attempts. Last error: {last_error}"
    ) from last_error
