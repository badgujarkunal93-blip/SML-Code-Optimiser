"""
Full integration test script for FastAPI speed-optimizer-backend.
"""

import asyncio
import os
import sys

# Ensure parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    print("--- 1. Testing GET /health ---")
    response = client.get("/health")
    print(f"Status Code: {response.status_code}, Body: {response.json()}")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    print("GET /health PASSED!\n")


def test_history():
    print("--- 2. Testing GET /history ---")
    response = client.get("/history")
    print(f"Status Code: {response.status_code}, Body Count: {len(response.json())}")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    print("GET /history PASSED!\n")


def test_optimize():
    print("--- 3. Testing POST /optimize ---")
    snippet = """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
"""
    payload = {"code": snippet, "language": "python"}

    # Set dummy Groq key if not present so we can inspect response handling
    if not os.environ.get("GROQ_API_KEY"):
        print("Note: GROQ_API_KEY not set. Expecting HTTP 502 error from Groq client...")
        response = client.post("/optimize", json=payload)
        print(f"Status Code: {response.status_code}, Body: {response.json()}")
        assert response.status_code == 502
        print("POST /optimize Error Handling (502) PASSED!\n")
    else:
        print("GROQ_API_KEY detected! Testing live optimization & benchmark flow...")
        response = client.post("/optimize", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Body: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert "optimized_code" in data
        assert "reasoning" in data
        print("POST /optimize Live Flow PASSED!\n")


if __name__ == "__main__":
    test_health()
    test_history()
    test_optimize()
