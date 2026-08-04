"use client";

import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const LANGUAGES = [
  { id: "python", name: "Python 3" },
  { id: "javascript", name: "JavaScript (Node.js)" },
  { id: "typescript", name: "TypeScript" },
  { id: "cpp", name: "C++ (GCC)" },
  { id: "java", name: "Java" },
];

const DEFAULT_PYTHON_EXAMPLE = `import random

random.seed(42)
arr = [random.randint(1, 1000) for _ in range(1200)]

def bubble_sort(a):
    n = len(a)
    for i in range(n):
        for j in range(0, n - i - 1):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
    return a

sorted_arr = bubble_sort(arr)
print("Count:", len(sorted_arr), "Min:", sorted_arr[0], "Max:", sorted_arr[-1])
`;

interface OptimizeResult {
  optimized_code: string;
  reasoning: string;
  original_time_ms: number | null;
  optimized_time_ms: number | null;
  improvement_pct: number | null;
  correctness_verified: boolean;
  benchmark_failed?: boolean;
}

export default function OptimizerPage() {
  const [code, setCode] = useState<string>(DEFAULT_PYTHON_EXAMPLE);
  const [language, setLanguage] = useState<string>("python");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleOptimize = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      if (!res.ok) {
        let errMessage = `Server error ${res.status}`;
        try {
          const errJson = await res.json();
          errMessage = errJson.detail || errMessage;
        } catch {}
        throw new Error(errMessage);
      }

      const data: OptimizeResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend service");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
          AI-Powered Code Optimizer
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-3xl">
          Paste your algorithm or source code below. Groq llama-3.3-70b analyzes bottlenecks and rewrites it for speed, while Piston benchmarks the real-world millisecond performance improvement.
        </p>
      </div>

      {/* Editor & Controls Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-300">Target Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-950 text-slate-200 text-sm font-medium border border-slate-800 rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCode(DEFAULT_PYTHON_EXAMPLE)}
              className="text-xs font-medium text-slate-400 hover:text-emerald-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3 py-2 rounded-lg transition-colors"
            >
              Load Example Snippet
            </button>

            <button
              onClick={handleOptimize}
              disabled={loading || !code.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Optimizing & Benchmarking...</span>
                </>
              ) : (
                <>
                  <span>⚡ Optimize Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Area */}
        <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="bg-slate-900/60 px-4 py-2 text-xs font-mono text-slate-400 border-b border-slate-800 flex justify-between items-center">
            <span>Input Code ({language})</span>
            <span>{code.split("\n").length} lines</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your source code snippet here..."
            rows={12}
            className="w-full p-4 bg-slate-950 text-slate-100 font-mono text-sm leading-relaxed outline-none border-none resize-y selection:bg-emerald-500/30"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold">Optimization Failed</p>
            <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Badges & Metrics Bar */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Improvement Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Performance:</span>
                {result.benchmark_failed || !result.correctness_verified || result.improvement_pct === null ? (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                    ⚠️ Benchmark Failed / Unverified
                  </span>
                ) : result.improvement_pct >= 0 ? (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 shadow-sm shadow-emerald-500/10">
                    🚀 +{result.improvement_pct}% Faster
                  </span>
                ) : (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-1">
                    ⚠️ {result.improvement_pct}% (Slower)
                  </span>
                )}
              </div>

              {/* Correctness Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Verification:</span>
                {result.correctness_verified ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 border border-teal-500/30 text-teal-300 flex items-center gap-1">
                    ✓ Output Verified
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                    ⚠️ Unverified Output
                  </span>
                )}
              </div>
            </div>

            {/* Timing Stats */}
            <div className="flex items-center gap-6 text-xs sm:text-sm">
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Original Time</span>
                <span className="font-mono font-bold text-slate-300">
                  {result.original_time_ms !== null ? `${result.original_time_ms} ms` : "N/A"}
                </span>
              </div>
              <span className="text-slate-600 text-xl font-light">→</span>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Optimized Time</span>
                <span className="font-mono font-bold text-emerald-400">
                  {result.optimized_time_ms !== null ? `${result.optimized_time_ms} ms` : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* AI Reasoning Box */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-2">
              <span>🧠</span> AI Optimization Analysis
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">{result.reasoning}</p>
          </div>

          {/* Side-by-Side Code Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Code */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Original Code
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {result.original_time_ms !== null ? `${result.original_time_ms} ms` : ""}
                </span>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-300 font-mono text-xs leading-relaxed overflow-x-auto flex-1">
                <code>{code}</code>
              </pre>
            </div>

            {/* Optimized Code */}
            <div className="bg-slate-900 rounded-2xl border border-emerald-500/30 overflow-hidden shadow-xl flex flex-col">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚡</span> Optimized Code
                </span>
                <button
                  onClick={() => handleCopy(result.optimized_code)}
                  className="text-xs font-medium text-slate-400 hover:text-emerald-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded transition-colors"
                >
                  {copied ? "Copied! ✓" : "Copy Code"}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-300 font-mono text-xs leading-relaxed overflow-x-auto flex-1 selection:bg-emerald-500/30">
                <code>{result.optimized_code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
