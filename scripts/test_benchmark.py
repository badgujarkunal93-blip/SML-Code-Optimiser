"""
Test script for verifying benchmark service with slow vs fast Bubble Sort snippets.
"""

import asyncio
import os
import sys

# Ensure parent directory is in sys.path for standalone execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.benchmark import compare

SLOW_BUBBLE_SORT_CODE = """
import random

random.seed(42)
arr = [random.randint(1, 1000) for _ in range(1500)]

def bubble_sort(a):
    n = len(a)
    for i in range(n):
        for j in range(0, n - i - 1):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
    return a

sorted_arr = bubble_sort(arr)
print("Length:", len(sorted_arr), "First 5:", sorted_arr[:5], "Last 5:", sorted_arr[-5:])
"""

FAST_SORT_CODE = """
import random

random.seed(42)
arr = [random.randint(1, 1000) for _ in range(1500)]

sorted_arr = sorted(arr)
print("Length:", len(sorted_arr), "First 5:", sorted_arr[:5], "Last 5:", sorted_arr[-5:])
"""


async def main():
    print("--- Running Benchmark Test (Piston API / Fallback) ---")
    print("Executing original (O(n^2) Bubble Sort on 1500 items) vs optimized (Timsort)...")

    result = await compare(
        original_code=SLOW_BUBBLE_SORT_CODE,
        optimized_code=FAST_SORT_CODE,
        language="python",
        reasoning="Replaced quadratic O(n^2) Bubble Sort algorithm with built-in Timsort O(n log n)."
    )

    print("\n=== BENCHMARK RESULTS ===")
    print(f"Original Time (ms):   {result['original_time_ms']} ms")
    print(f"Optimized Time (ms):  {result['optimized_time_ms']} ms")
    print(f"Improvement (%):      {result['improvement_pct']}%")
    print(f"Correctness Verified: {result['correctness_verified']}")
    print(f"\nReasoning:\n{result['reasoning']}")


if __name__ == "__main__":
    asyncio.run(main())
