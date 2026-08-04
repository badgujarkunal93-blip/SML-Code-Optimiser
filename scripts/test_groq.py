"""
Test script for verifying Groq client code optimization standalone.
"""

import asyncio
import os
import sys

# Ensure parent directory is in sys.path for standalone execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.groq_client import optimize_code, GroqOptimizationError

SLOW_BUBBLE_SORT_PYTHON = """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr
"""


async def main():
    print("--- Testing Groq Code Optimization ---")
    print("Input Code:")
    print(SLOW_BUBBLE_SORT_PYTHON.strip())
    print("\nCalling optimize_code(code, 'python')...\n")

    try:
        result = await optimize_code(SLOW_BUBBLE_SORT_PYTHON, "python")
        print("=== OPTIMIZATION SUCCESSFUL ===")
        print("\n--- Optimized Code ---")
        print(result["optimized_code"])
        print("\n--- Reasoning ---")
        print(result["reasoning"])
    except GroqOptimizationError as exc:
        print(f"\n[ERROR] GroqOptimizationError caught: {exc}")
    except Exception as exc:
        print(f"\n[ERROR] Unexpected Exception: {exc}")


if __name__ == "__main__":
    asyncio.run(main())
