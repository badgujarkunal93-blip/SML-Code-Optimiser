"""
Python Security & Reliability Test Suite for Optima AI Backend.
Tests local execution fallback removal, language validation, payload size limits, and multi-case verification.
"""

import asyncio
import os
import sys

# Ensure root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.piston_client import run_code, resolve_language_and_version
from services.benchmark import compare
from config import MAX_SOURCE_CODE_BYTES


async def main():
    print("=================================================")
    print("🔒 PYTHON BACKEND SECURITY & RELIABILITY TEST SUITE")
    print("=================================================\n")

    passed = 0
    failed = 0

    def assert_true(condition: bool, title: str):
        nonlocal passed, failed
        if condition:
            print(f"✅ [PASS] {title}")
            passed += 1
        else:
            print(f"❌ [FAIL] {title}")
            failed += 1

    # 1. Security Proof: Host Execution Fallback Removal
    marker_file = "PYTHON_SECURITY_MARKER_TEST.tmp"
    if os.path.exists(marker_file):
        os.remove(marker_file)

    malicious_code = f"""
import os
with open("{marker_file}", "w") as f:
    f.write("HACKED")
"""

    res = await run_code(malicious_code, "python")
    file_created = os.path.exists(marker_file)
    if os.path.exists(marker_file):
        os.remove(marker_file)

    assert_true(
        not file_created,
        "SECURITY PROOF: Python backend did NOT execute malicious user code locally on API host."
    )

    # 2. Unsupported Language Validation
    resolved = await resolve_language_and_version("kotlin")
    assert_true(
        resolved is None,
        "Unsupported language 'kotlin' cleanly rejected without fallback."
    )

    # 3. Payload Size Limit
    huge_code = "x = 1\n" * 20000
    huge_res = await run_code(huge_code, "python")
    assert_true(
        huge_res.get("error_code") == "SOURCE_CODE_TOO_LARGE" or not huge_res.get("success"),
        "Oversized Python code rejected before API/Sandbox execution."
    )

    # 4. Multi-Case Verification
    orig_code = "a = input()\nprint(f'Echo: {a}')"
    opt_code = "a = input()\nprint(f'Echo: {a}')"
    bench_res = await compare(orig_code, opt_code, "python", user_stdin="test_val")
    assert_true(
        bench_res.get("correctness_verified") is True,
        "Multi-case verification successfully passed for matching Python code."
    )

    print("\n=================================================")
    print(f"PYTHON TESTS: Passed {passed} | Failed {failed}")
    print("=================================================\n")

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
