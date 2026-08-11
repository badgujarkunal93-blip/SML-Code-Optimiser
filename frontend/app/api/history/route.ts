import { NextResponse } from "next/server";

const DEMO_RECORDS = [
  {
    id: "rec_98f41a2b",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    language: "python",
    original_time_ms: 142.5,
    optimized_time_ms: 12.8,
    improvement_pct: 91.0,
    correctness_verified: true,
  },
  {
    id: "rec_87d32c1e",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    language: "rust",
    original_time_ms: 48.2,
    optimized_time_ms: 3.1,
    improvement_pct: 93.6,
    correctness_verified: true,
  },
  {
    id: "rec_76b21f0a",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    language: "typescript",
    original_time_ms: 95.0,
    optimized_time_ms: 26.6,
    improvement_pct: 72.0,
    correctness_verified: true,
  },
  {
    id: "rec_65a10e9b",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    language: "cpp",
    original_time_ms: 112.0,
    optimized_time_ms: 4.5,
    improvement_pct: 96.0,
    correctness_verified: true,
  },
  {
    id: "rec_5490fd8a",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    language: "javascript",
    original_time_ms: 78.4,
    optimized_time_ms: 28.2,
    improvement_pct: 64.0,
    correctness_verified: true,
  },
  {
    id: "rec_438fec7b",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    language: "go",
    original_time_ms: 62.0,
    optimized_time_ms: 11.2,
    improvement_pct: 82.0,
    correctness_verified: true,
  },
  {
    id: "rec_327edb6c",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    language: "java",
    original_time_ms: 134.0,
    optimized_time_ms: 32.2,
    improvement_pct: 76.0,
    correctness_verified: true,
  },
];

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  if (backendUrl && backendUrl !== "http://localhost:3001") {
    try {
      const res = await fetch(`${backendUrl.replace(/\/$/, "")}/history`, { next: { revalidate: 0 } });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback below
    }
  }
  return NextResponse.json({ history: DEMO_RECORDS });
}
