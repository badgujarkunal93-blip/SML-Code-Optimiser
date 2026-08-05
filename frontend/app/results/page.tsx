"use client";

import Link from "next/link";
import { useState } from "react";

export default function ResultsPage() {
  const [copied, setCopied] = useState(false);

  const sampleReport = {
    requestId: "opt_98f41a2b",
    timestamp: new Date().toISOString(),
    language: "Python 3",
    mode: "Auto (Balanced)",
    originalComplexity: "O(n²)",
    optimizedComplexity: "O(n)",
    originalTimeMs: 142.5,
    optimizedTimeMs: 12.8,
    improvementPct: 91.0,
    score: 98,
    confidence: 99,
    originalCode: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`,
    optimizedCode: `def optimized_sort(arr):
    # O(n log n) Timsort algorithm implementation
    return sorted(arr)`,
    reasoning:
      "Replaced standard nested O(n²) bubble sort algorithm with Python's native C-implemented Timsort algorithm sorted(). Eliminates intermediate variable allocations, reducing runtime execution time by 91%.",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleReport.optimizedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 w-full max-w-[1440px] mx-auto font-mono text-xs">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-[#3c4a46]/30 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-[#57f1db]">📄</span> Optimization Results &amp; Audit Report
          </h1>
          <p className="text-[#bacac5] text-xs mt-1">
            Request ID: <span className="text-[#2DD4BF] font-bold">{sampleReport.requestId}</span> | {sampleReport.timestamp}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="bg-[#0F172A] hover:bg-slate-800 text-[#57f1db] px-4 py-2 rounded-xl border border-[#2DD4BF]/30 font-bold"
          >
            {copied ? "Copied!" : "📋 Copy Optimized Code"}
          </button>
          <Link
            href="/workspace"
            className="bg-[#2DD4BF] hover:bg-[#57f1db] text-[#020617] px-5 py-2 rounded-xl font-bold"
          >
            Open in Workspace →
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-[#2DD4BF]/40">
          <span className="text-[#bacac5] text-[10px] uppercase block mb-1">Time Complexity</span>
          <div className="text-white font-bold text-base flex gap-2">
            <span className="line-through text-rose-400">{sampleReport.originalComplexity}</span>
            <span className="text-[#2DD4BF]">→ {sampleReport.optimizedComplexity}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-[#3c4a46]/30">
          <span className="text-[#bacac5] text-[10px] uppercase block mb-1">Wall-Clock Runtime</span>
          <div className="text-white font-bold text-base flex gap-2">
            <span className="text-slate-400">{sampleReport.originalTimeMs}ms</span>
            <span className="text-emerald-400">→ {sampleReport.optimizedTimeMs}ms</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-[#3c4a46]/30">
          <span className="text-[#bacac5] text-[10px] uppercase block mb-1">Speedup Percentage</span>
          <div className="text-[#2DD4BF] font-bold text-xl">+{sampleReport.improvementPct}%</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-[#3c4a46]/30">
          <span className="text-[#bacac5] text-[10px] uppercase block mb-1">AI Confidence Score</span>
          <div className="text-white font-bold text-xl">{sampleReport.confidence}%</div>
        </div>
      </div>

      {/* Code Diffs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-xl border border-[#3c4a46]/30 space-y-2">
          <div className="text-slate-400 font-bold uppercase text-[11px] border-b border-[#3c4a46]/30 pb-2">
            🔴 Original Input Code
          </div>
          <pre className="p-3 bg-[#020617] text-slate-300 rounded-lg overflow-x-auto leading-relaxed">
            <code>{sampleReport.originalCode}</code>
          </pre>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-[#2DD4BF]/40 space-y-2">
          <div className="text-[#2DD4BF] font-bold uppercase text-[11px] border-b border-[#3c4a46]/30 pb-2">
            🟢 Refactored &amp; Optimized Code
          </div>
          <pre className="p-3 bg-[#020617] text-[#2DD4BF] rounded-lg overflow-x-auto leading-relaxed">
            <code>{sampleReport.optimizedCode}</code>
          </pre>
        </div>
      </div>

      {/* AI Reasoning */}
      <div className="glass-panel p-6 rounded-2xl border border-[#3c4a46]/30 space-y-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#2DD4BF]">smart_toy</span>
          AI Refactoring &amp; Performance Reasoning
        </h3>
        <p className="text-slate-300 text-xs leading-relaxed font-sans">{sampleReport.reasoning}</p>
      </div>
    </div>
  );
}
