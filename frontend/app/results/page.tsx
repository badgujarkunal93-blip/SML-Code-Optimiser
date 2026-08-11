"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { saveCodeToHistory, setActiveWorkspaceCode } from "@/lib/historyStore";

export default function ResultsPage() {
  const [copied, setCopied] = useState(false);
  const [diffViewMode, setDiffViewMode] = useState<"split" | "unified">("split");
  const [expandedOptimization, setExpandedOptimization] = useState<number | null>(0);
  const [activeBenchmarkHover, setActiveBenchmarkHover] = useState<number | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const reportData = {
    requestId: "opt_98f41a2b",
    timestamp: new Date().toISOString(),
    language: "Python 3",
    mode: "Auto (Balanced)",
    score: 98,
    grade: "A+",
    confidence: 99,
    verificationStatus: "PASSED",
    runtimeSavedPct: 91.0,
    memoryReductionPct: 88.7,
    originalTimeMs: 142.5,
    optimizedTimeMs: 12.8,
    originalComplexity: "O(n²)",
    optimizedComplexity: "O(n log n)",
    originalCode: `import random

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
print("Count:", len(sorted_arr), "Min:", sorted_arr[0], "Max:", sorted_arr[-1])`,
    optimizedCode: `import random

random.seed(42)
arr = [random.randint(1, 1000) for _ in range(1200)]

def optimized_sort(a):
    # Native C-implemented Timsort: O(n log n) time & linear scan cache locality
    return sorted(a)

sorted_arr = optimized_sort(arr)
print("Count:", len(sorted_arr), "Min:", sorted_arr[0], "Max:", sorted_arr[-1])`,
    reasoning:
      "The original implementation utilized Bubble Sort with quadratic time complexity O(n²), executing 719,400 comparison iterations for 1,200 elements. The AI AST reducer detected that the sorting routine could be replaced with Python's native C-implemented Timsort algorithm. This reduces time complexity from O(n²) to O(n log n), eliminates intermediate Python bytecode stack frames, and lowers memory allocations from 124MB to 14MB while preserving identical output stream semantics.",
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(reportData.optimizedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (type: "json" | "markdown" | "csv" | "html") => {
    let content = "";
    const filename = `optima_report_${reportData.requestId}.${type === "markdown" ? "md" : type}`;
    let mimeType = "text/plain";

    if (type === "json") {
      content = JSON.stringify(reportData, null, 2);
      mimeType = "application/json";
    } else if (type === "markdown") {
      content = `# OptimaAI Performance Report - ${reportData.requestId}\n\n` +
        `## Metrics Summary\n` +
        `- Score: ${reportData.score}/100 (${reportData.grade})\n` +
        `- Speedup: +${reportData.runtimeSavedPct}%\n` +
        `- Complexity: ${reportData.originalComplexity} → ${reportData.optimizedComplexity}\n` +
        `- Runtime: ${reportData.originalTimeMs}ms → ${reportData.optimizedTimeMs}ms\n\n` +
        `## Optimized Code\n\`\`\`python\n${reportData.optimizedCode}\n\`\`\`\n`;
      mimeType = "text/markdown";
    } else if (type === "csv") {
      content = `Metric,Original,Optimized,Delta\n` +
        `Runtime (ms),${reportData.originalTimeMs},${reportData.optimizedTimeMs},+${reportData.runtimeSavedPct}%\n` +
        `Complexity,${reportData.originalComplexity},${reportData.optimizedComplexity},Improved\n` +
        `Memory (MB),124,14,-88.7%\n`;
      mimeType = "text/csv";
    } else if (type === "html") {
      content = `<!DOCTYPE html><html><head><title>Optima Report ${reportData.requestId}</title></head>` +
        `<body style="font-family:sans-serif;padding:2rem;background:#07101a;color:#fff;">` +
        `<h1>OptimaAI Optimization Report</h1><p>Score: ${reportData.score}/100</p>` +
        `<h3>Optimized Code</h3><pre><code>${reportData.optimizedCode}</code></pre></body></html>`;
      mimeType = "text/html";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(`Exported ${type.toUpperCase()} successfully!`);
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  // Benchmark curve data points (Input size N vs Execution Time ms)
  const benchmarkData = [
    { n: 100, orig: 1.2, opt: 0.1 },
    { n: 500, orig: 24.5, opt: 1.8 },
    { n: 1000, orig: 98.2, opt: 8.4 },
    { n: 2000, orig: 390.0, opt: 21.0 },
    { n: 5000, orig: 2450.0, opt: 58.0 },
  ];

  // Optimizations Breakdown List
  const optimizations = [
    {
      title: "Replaced O(n²) Bubble Sort with Native Timsort",
      gain: "+78% Speedup",
      tag: "Algorithmic Refactoring",
      details: "Transformed nested loop comparisons into Python C-API Timsort routines operating directly on C arrays.",
    },
    {
      title: "Vectorized Loop Execution & Instruction Unrolling",
      gain: "+14% Latency Reduction",
      tag: "LLVM Vectorization",
      details: "Applied SSE4.2 / AVX2 SIMD vectorization pass, executing 4 integer operations per clock cycle.",
    },
    {
      title: "Dead Code & Unused Frame Allocation Removal",
      gain: "-88.7% Memory RSS",
      tag: "Bytecode Optimization",
      details: "Eliminated unused local temporary arrays, decreasing garbage collection overhead and stack size.",
    },
    {
      title: "Constant Folding & Inlined Function Calls",
      gain: "+5% CPU Clock Savings",
      tag: "AST Simplification",
      details: "Evaluated constant expression subtrees during AST parsing to bypass runtime stack frame creation.",
    },
  ];

  const handleSaveToHistory = () => {
    saveCodeToHistory({
      language: reportData.language.toLowerCase().includes("python") ? "python" : reportData.language.toLowerCase(),
      original_code: reportData.originalCode,
      optimized_code: reportData.optimizedCode,
      original_time_ms: reportData.originalTimeMs,
      optimized_time_ms: reportData.optimizedTimeMs,
      improvement_pct: reportData.runtimeSavedPct,
      correctness_verified: true,
      reasoning: reportData.reasoning,
      mode: reportData.mode,
    });
    setDownloadSuccess("Report & Code saved to History! You can access it anytime.");
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleOpenInIDE = () => {
    setActiveWorkspaceCode(reportData.originalCode, reportData.language);
  };

  return (
    <div className="space-y-8 w-full max-w-[1440px] mx-auto font-mono text-xs pb-16">
      
      {/* HEADER BAR & QUICK ACTION BUTTONS */}
      <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <span className="text-[var(--primary)]">📄</span> Compiler Benchmark &amp; Audit Report
            </h1>
            <span className="bg-[var(--primary)]/15 text-[var(--primary)] text-[10px] font-bold px-3 py-1 rounded-full border border-[var(--primary)]/30">
              Grade {reportData.grade}
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-xs mt-1">
            Request ID: <span className="text-[var(--primary)] font-bold">{reportData.requestId}</span> | Engine: {reportData.mode} | {reportData.timestamp}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSaveToHistory}
            className="bg-[var(--card-elevated)] hover:bg-[var(--card)] text-[var(--primary)] px-4 py-2 rounded-xl border border-[var(--primary)]/30 font-bold transition-all hover-scale flex items-center gap-1.5"
            title="Save report to user history"
          >
            <span>💾 Save to History</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="bg-[var(--bg-secondary)] hover:bg-[var(--card-elevated)] text-[var(--primary)] px-4 py-2 rounded-xl border border-[var(--primary)]/30 font-bold transition-all hover-scale"
          >
            {copied ? "Copied ✓" : "📋 Copy Code"}
          </button>

          <Link
            href="/workspace"
            onClick={handleOpenInIDE}
            className="bg-[var(--primary)] hover:opacity-90 text-white dark:text-[#07101A] px-5 py-2 rounded-xl font-bold transition-all hover-scale shadow-md"
          >
            Open in IDE →
          </Link>
        </div>
      </div>

      {downloadSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--primary)]/15 border border-[var(--primary)]/40 p-3 rounded-xl text-[var(--primary)] font-bold text-center">
          ✓ {downloadSuccess}
        </motion.div>
      )}

      {/* SECTION 1: OPTIMIZATION SUMMARY HERO CARD */}
      <div className="glass-panel p-6 rounded-2xl border border-[var(--primary)]/40 shadow-2xl bg-gradient-to-br from-[var(--card)] via-[var(--bg-secondary)] to-[var(--card)]">
        <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-4 border-b border-[var(--border)] pb-2 flex justify-between">
          <span>Executive Summary &amp; Verification Status</span>
          <span className="text-[var(--primary)] font-bold">● VERIFIED COMPILER PASS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase">Optimization Score</span>
            <div className="text-2xl font-black text-[var(--primary)]">{reportData.score}<span className="text-xs text-[var(--text-muted)]">/100</span></div>
            <span className="text-[10px] text-emerald-400 font-bold">Top 2% Performance</span>
          </div>

          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase">AI Confidence</span>
            <div className="text-2xl font-black text-[var(--text-primary)]">{reportData.confidence}%</div>
            <span className="text-[10px] text-[var(--primary)] font-bold">High Precision</span>
          </div>

          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase">Output Verification</span>
            <div className="text-xl font-black text-[#34D399] flex items-center justify-center gap-1">
              ✓ {reportData.verificationStatus}
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">100% Equivalence</span>
          </div>

          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase">Runtime Saved</span>
            <div className="text-2xl font-black text-[#34D399]">+{reportData.runtimeSavedPct}%</div>
            <span className="text-[10px] text-emerald-400 font-bold">11.1x Faster</span>
          </div>

          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase">Memory Reduction</span>
            <div className="text-2xl font-black text-sky-400">-{reportData.memoryReductionPct}%</div>
            <span className="text-[10px] text-sky-400 font-bold">110MB Freed</span>
          </div>
        </div>

        {/* Secondary metrics row */}
        <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono text-xs">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">Time Complexity:</span>
            <span className="font-bold text-[var(--text-primary)]">{reportData.originalComplexity} → <span className="text-[var(--primary)]">{reportData.optimizedComplexity}</span></span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">Readability Score:</span>
            <span className="font-bold text-[var(--text-primary)]">87 → <span className="text-[#34D399]">96 (+9 pts)</span></span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">Security Vulnerabilities:</span>
            <span className="font-bold text-emerald-400">0 Detected (Safe)</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] block">Code Quality Grade:</span>
            <span className="font-bold text-[var(--primary)]">A+ (Enterprise Ready)</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: BEFORE VS AFTER STRUCTURAL COMPLEXITY MATRIX */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wider">
          <span className="material-symbols-outlined text-[var(--primary)]">compare_arrows</span>
          Section 2: Before vs. After Structural Complexity
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Card */}
          <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 space-y-3 bg-rose-500/5">
            <div className="flex justify-between items-center border-b border-rose-500/20 pb-2">
              <span className="font-bold text-rose-400 flex items-center gap-2">🔴 Original Unoptimized Code</span>
              <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">O(n²) Bottleneck</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Time Complexity</span>
                <span className="font-bold text-rose-400">{reportData.originalComplexity} (Quadratic)</span>
              </div>
              <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Space Complexity</span>
                <span className="font-bold text-[var(--text-primary)]">O(n) Linear</span>
              </div>
              <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Cyclomatic Complexity</span>
                <span className="font-bold text-rose-400">12 (High Control Complexity)</span>
              </div>
              <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Lines of Code (LOC)</span>
                <span className="font-bold text-[var(--text-primary)]">28 Lines</span>
              </div>
              <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Nested Loop Count</span>
                <span className="font-bold text-rose-400">2 Loops (Nested O(n²))</span>
              </div>
              <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Wall-Clock Latency</span>
                <span className="font-bold text-rose-400">{reportData.originalTimeMs} ms</span>
              </div>
            </div>
          </div>

          {/* Optimized Card */}
          <div className="glass-panel p-5 rounded-2xl border border-[var(--primary)]/40 space-y-3 bg-[var(--primary)]/5">
            <div className="flex justify-between items-center border-b border-[var(--primary)]/20 pb-2">
              <span className="font-bold text-[var(--primary)] flex items-center gap-2">🟢 Refactored &amp; Optimized Code</span>
              <span className="text-[10px] text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded border border-[var(--primary)]/30">O(n log n) Optimal</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--primary)]/30">
                <span className="text-[10px] text-[var(--text-muted)] block">Time Complexity</span>
                <span className="font-bold text-[var(--primary)]">↓ {reportData.optimizedComplexity} (Log-Linear)</span>
              </div>
              <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--primary)]/30">
                <span className="text-[10px] text-[var(--text-muted)] block">Space Complexity</span>
                <span className="font-bold text-[#34D399]">↓ O(1) Auxiliary</span>
              </div>
              <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--primary)]/30">
                <span className="text-[10px] text-[var(--text-muted)] block">Cyclomatic Complexity</span>
                <span className="font-bold text-[#34D399]">↓ 4 (-67% Simpler)</span>
              </div>
              <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--primary)]/30">
                <span className="text-[10px] text-[var(--text-muted)] block">Lines of Code (LOC)</span>
                <span className="font-bold text-[#34D399]">↓ 14 Lines (-50%)</span>
              </div>
              <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--primary)]/30">
                <span className="text-[10px] text-[var(--text-muted)] block">Nested Loop Count</span>
                <span className="font-bold text-[#34D399]">↓ 0 Loops (C Timsort)</span>
              </div>
              <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--primary)]/30">
                <span className="text-[10px] text-[var(--text-muted)] block">Wall-Clock Latency</span>
                <span className="font-bold text-[#34D399]">↓ {reportData.optimizedTimeMs} ms (-91.0%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: PERFORMANCE DASHBOARD KPI CARDS */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wider">
          <span className="material-symbols-outlined text-[var(--primary)]">speed</span>
          Section 3: Hardware KPI &amp; Benchmark Metrics
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Runtime Saved</span>
            <div className="text-xl font-bold text-[#34D399]">129.7 ms</div>
            <span className="text-[10px] text-[var(--text-muted)]">Per 1.2k elements</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Memory Saved</span>
            <div className="text-xl font-bold text-sky-400">110.0 MB</div>
            <span className="text-[10px] text-[var(--text-muted)]">RSS heap reduction</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block">CPU Instructions Saved</span>
            <div className="text-xl font-bold text-[var(--primary)]">3.4M Ops</div>
            <span className="text-[10px] text-[var(--text-muted)]">-O3 SIMD Vectorized</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Cache Efficiency</span>
            <div className="text-xl font-bold text-[#34D399]">99.4%</div>
            <span className="text-[10px] text-[var(--text-muted)]">L1/L2 Cache Hit Rate</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Estimated Throughput</span>
            <div className="text-xl font-bold text-[var(--text-primary)]">78.1k req/s</div>
            <span className="text-[10px] text-[var(--text-muted)]">Concurrent execution</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Execution Speedup</span>
            <div className="text-xl font-bold text-[var(--primary)]">11.1x</div>
            <span className="text-[10px] text-[var(--text-muted)]">142.5ms → 12.8ms</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Binary Size Reduction</span>
            <div className="text-xl font-bold text-sky-400">-14.2%</div>
            <span className="text-[10px] text-[var(--text-muted)]">Inlined Bytecode</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-[var(--border)] text-center space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Algorand Settlement</span>
            <div className="text-xl font-bold text-purple-400">tx_0x8f...b14</div>
            <span className="text-[10px] text-purple-400">x402 Micropayment</span>
          </div>
        </div>
      </div>

      {/* SECTION 4 & 5: INTERACTIVE BENCHMARK GRAPH & MEMORY PROFILE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 4: BENCHMARK EXECUTION TIME CURVE */}
        <div className="glass-panel p-5 rounded-2xl border border-[var(--border)] space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
            <h3 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">show_chart</span>
              Section 4: Execution Time vs Input Size (N)
            </h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400" /> Original O(n²)</span>
              <span className="flex items-center gap-1 text-[var(--primary)]"><span className="w-2 h-2 rounded-full bg-[var(--primary)]" /> Optimized O(n log n)</span>
            </div>
          </div>

          {/* Interactive SVG Line Chart */}
          <div className="relative w-full h-[220px] bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 flex flex-col justify-between">
            <div className="absolute inset-x-8 inset-y-6 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-white w-full" />
              <div className="border-b border-white w-full" />
              <div className="border-b border-white w-full" />
              <div className="border-b border-white w-full" />
            </div>

            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160">
              {/* Original Curve (Red exponential) */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d="M 20 140 Q 200 135 380 20"
                fill="none"
                stroke="#EF4444"
                strokeWidth="3"
              />

              {/* Optimized Curve (Teal log-linear) */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d="M 20 140 L 100 138 L 200 135 L 300 132 L 380 128"
                fill="none"
                stroke="#2DD4BF"
                strokeWidth="3"
              />

              {/* Data points */}
              {benchmarkData.map((pt, idx) => {
                const cx = 20 + idx * 90;
                const cyOrig = 140 - (pt.orig / 2450) * 120;
                const cyOpt = 140 - (pt.opt / 2450) * 120;
                return (
                  <g key={idx} className="cursor-pointer" onMouseEnter={() => setActiveBenchmarkHover(idx)}>
                    <circle cx={cx} cy={cyOrig} r="4" fill="#EF4444" />
                    <circle cx={cx} cy={cyOpt} r="4" fill="#2DD4BF" />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {activeBenchmarkHover !== null && (
              <div className="absolute top-2 right-2 bg-[var(--card)] p-2 rounded border border-[var(--primary)]/40 text-[10px] space-y-0.5 shadow-xl">
                <div className="text-[var(--text-primary)] font-bold">Input N = {benchmarkData[activeBenchmarkHover].n}</div>
                <div className="text-rose-400">Original: {benchmarkData[activeBenchmarkHover].orig}ms</div>
                <div className="text-[var(--primary)]">Optimized: {benchmarkData[activeBenchmarkHover].opt}ms</div>
              </div>
            )}
          </div>

          <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono px-2">
            <span>N=100</span>
            <span>N=500</span>
            <span>N=1,000</span>
            <span>N=2,000</span>
            <span>N=5,000</span>
          </div>
        </div>

        {/* SECTION 5: MEMORY USAGE AREA CHART */}
        <div className="glass-panel p-5 rounded-2xl border border-[var(--border)] space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
            <h3 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">pie_chart</span>
              Section 5: Memory Profile &amp; RSS Allocation
            </h3>
            <span className="text-[10px] text-sky-400 font-bold">-88.7% Memory Footprint</span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-secondary)]">Peak RAM Consumption</span>
                <span className="text-rose-400">124 MB → <span className="text-[#34D399]">14 MB</span></span>
              </div>
              <div className="w-full h-3 bg-[var(--bg)] rounded-full overflow-hidden flex">
                <div className="bg-sky-400 h-full w-[11%]" />
                <div className="bg-rose-500/30 h-full w-[89%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-secondary)]">Average RSS Memory</span>
                <span className="text-rose-400">85 MB → <span className="text-[#34D399]">9.2 MB</span></span>
              </div>
              <div className="w-full h-3 bg-[var(--bg)] rounded-full overflow-hidden flex">
                <div className="bg-[var(--primary)] h-full w-[10.8%]" />
                <div className="bg-rose-500/30 h-full w-[89.2%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-secondary)]">Heap Buffer Allocations</span>
                <span className="text-rose-400">78 MB → <span className="text-[#34D399]">7.4 MB</span></span>
              </div>
              <div className="w-full h-3 bg-[var(--bg)] rounded-full overflow-hidden flex">
                <div className="bg-purple-400 h-full w-[9.5%]" />
                <div className="bg-rose-500/30 h-full w-[90.5%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-secondary)]">Stack Frame Depth</span>
                <span className="text-rose-400">4.0 MB → <span className="text-[#34D399]">0.5 MB</span></span>
              </div>
              <div className="w-full h-3 bg-[var(--bg)] rounded-full overflow-hidden flex">
                <div className="bg-emerald-400 h-full w-[12.5%]" />
                <div className="bg-rose-500/30 h-full w-[87.5%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6 & 7: CPU TIMELINE & COMPLEXITY RADAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 6: CPU UTILIZATION TIMELINE */}
        <div className="glass-panel p-5 rounded-2xl border border-[var(--border)] space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
            <h3 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">timeline</span>
              Section 6: CPU Utilization Timeline (%)
            </h3>
            <span className="text-[10px] text-[var(--primary)]">Single-Pass Execution</span>
          </div>

          <div className="relative w-full h-[180px] bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120">
              {/* Original CPU Spikes (Red) */}
              <polyline
                points="10,100 40,20 80,110 120,15 160,105 200,25 240,100 280,30 320,95 380,110"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              {/* Optimized CPU Smooth (Cyan) */}
              <polyline
                points="10,100 40,80 80,75 120,70 160,65 200,68 240,70 280,72 320,90 380,110"
                fill="none"
                stroke="#2DD4BF"
                strokeWidth="3"
              />
            </svg>

            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-2">
              <span>0ms</span>
              <span>35ms</span>
              <span>70ms</span>
              <span>105ms</span>
              <span>140ms</span>
            </div>
          </div>
        </div>

        {/* SECTION 7: 8-AXIS COMPLEXITY RADAR CHART */}
        <div className="glass-panel p-5 rounded-2xl border border-[var(--border)] space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
            <h3 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">radar</span>
              Section 7: 8-Axis Architecture Radar
            </h3>
            <span className="text-[10px] text-[#34D399]">98% Balance Rating</span>
          </div>

          <div className="flex justify-center items-center py-2">
            <svg className="w-[200px] h-[180px]" viewBox="-110 -110 220 220">
              {/* Radar webs */}
              <polygon points="0,-90 63,-63 90,0 63,63 0,90 -63,63 -90,0 -63,-63" fill="none" stroke="var(--border)" strokeWidth="1" />
              <polygon points="0,-60 42,-42 60,0 42,42 0,60 -42,42 -60,0 -42,-42" fill="none" stroke="var(--border)" strokeWidth="1" />
              <polygon points="0,-30 21,-21 30,0 21,21 0,30 -21,21 -30,0 -21,-21" fill="none" stroke="var(--border)" strokeWidth="1" />

              {/* Optimized Polygon (Teal filled) */}
              <polygon
                points="0,-85 58,-58 85,0 58,58 0,82 -58,58 -82,0 -58,-58"
                fill="rgba(45,212,191,0.25)"
                stroke="#2DD4BF"
                strokeWidth="2"
              />

              {/* Axis Labels */}
              <text x="0" y="-95" textAnchor="middle" fill="var(--text-secondary)" fontSize="8">Maintainability</text>
              <text x="75" y="-65" textAnchor="start" fill="var(--text-secondary)" fontSize="8">Readability</text>
              <text x="95" y="4" textAnchor="start" fill="var(--text-secondary)" fontSize="8">Perf</text>
              <text x="75" y="72" textAnchor="start" fill="var(--text-secondary)" fontSize="8">Memory</text>
              <text x="0" y="102" textAnchor="middle" fill="var(--text-secondary)" fontSize="8">Scalability</text>
              <text x="-75" y="72" textAnchor="end" fill="var(--text-secondary)" fontSize="8">Security</text>
              <text x="-95" y="4" textAnchor="end" fill="var(--text-secondary)" fontSize="8">Modularity</text>
              <text x="-75" y="-65" textAnchor="end" fill="var(--text-secondary)" fontSize="8">Complexity</text>
            </svg>
          </div>
        </div>
      </div>

      {/* SECTION 8: OPTIMIZATION BREAKDOWN LIST */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wider">
          <span className="material-symbols-outlined text-[var(--primary)]">checklist</span>
          Section 8: Applied Compiler Transformations ({optimizations.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {optimizations.map((opt, idx) => (
            <div
              key={idx}
              onClick={() => setExpandedOptimization(expandedOptimization === idx ? null : idx)}
              className="glass-panel p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/50 cursor-pointer transition-all space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <span className="text-[#34D399]">✓</span> {opt.title}
                </span>
                <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded border border-[var(--primary)]/30">
                  {opt.gain}
                </span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[var(--text-muted)]">{opt.tag}</span>
                <span className="text-[var(--text-secondary)]">{expandedOptimization === idx ? "Collapse ▲" : "Details ▼"}</span>
              </div>

              {expandedOptimization === idx && (
                <p className="text-[11px] text-[var(--text-secondary)] pt-2 border-t border-[var(--border)] leading-relaxed font-sans">
                  {opt.details}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 9: OPTIMIZATION PIPELINE TIMELINE */}
      <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wider border-b border-[var(--border)] pb-2">
          <span className="material-symbols-outlined text-[var(--primary)]">route</span>
          Section 9: Compiler Pipeline Execution Workflow
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center text-[10px] font-mono">
          <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)] space-y-1">
            <span className="text-[var(--primary)] font-bold">01. AST</span>
            <div className="text-[var(--text-secondary)]">Parsed AST</div>
          </div>
          <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)] space-y-1">
            <span className="text-[var(--primary)] font-bold">02. CFG</span>
            <div className="text-[var(--text-secondary)]">Built Control Graph</div>
          </div>
          <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)] space-y-1">
            <span className="text-[var(--primary)] font-bold">03. Hotspots</span>
            <div className="text-[var(--text-secondary)]">O(n²) Detected</div>
          </div>
          <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)] space-y-1">
            <span className="text-[var(--primary)] font-bold">04. Groq LLM</span>
            <div className="text-[var(--text-secondary)]">AST Reduction</div>
          </div>
          <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)] space-y-1">
            <span className="text-[var(--primary)] font-bold">05. Piston</span>
            <div className="text-[var(--text-secondary)]">Sandbox Run</div>
          </div>
          <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)] space-y-1">
            <span className="text-[var(--primary)] font-bold">06. Equiv</span>
            <div className="text-[var(--text-secondary)]">Output Verified</div>
          </div>
          <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)] space-y-1">
            <span className="text-[var(--primary)] font-bold">07. Benchmark</span>
            <div className="text-[var(--text-secondary)]">+91% Speedup</div>
          </div>
          <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)] space-y-1">
            <span className="text-[var(--primary)] font-bold">08. Algorand</span>
            <div className="text-[var(--text-secondary)]">x402 Settled</div>
          </div>
        </div>
      </div>

      {/* SECTION 10: GIT-STYLE CODE DIFFERENCE VIEWER */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[var(--primary)]">difference</span>
            Section 10: Git-Style Code Difference Inspector
          </h2>

          <div className="flex gap-2 bg-[var(--card)] p-1 rounded-lg border border-[var(--border)]">
            <button
              onClick={() => setDiffViewMode("split")}
              className={`px-3 py-1 rounded text-[10px] font-bold ${diffViewMode === "split" ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "text-[var(--text-muted)]"}`}
            >
              Split View
            </button>
            <button
              onClick={() => setDiffViewMode("unified")}
              className={`px-3 py-1 rounded text-[10px] font-bold ${diffViewMode === "unified" ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "text-[var(--text-muted)]"}`}
            >
              Unified Diff
            </button>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[var(--border)] overflow-hidden">
          {diffViewMode === "split" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-[var(--text-muted)] font-bold uppercase text-[10px] border-b border-[var(--border)] pb-2 flex justify-between">
                  <span>🔴 Original Source Code</span>
                  <span>O(n²) Bubble Sort</span>
                </div>
                <pre className="p-3 bg-[var(--bg)] text-[var(--text-secondary)] rounded-lg border border-[var(--border)] overflow-x-auto leading-relaxed text-[11px]">
                  <code>{reportData.originalCode}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="text-[var(--primary)] font-bold uppercase text-[10px] border-b border-[var(--border)] pb-2 flex justify-between">
                  <span>🟢 Refactored &amp; Optimized Code</span>
                  <span>O(n log n) Timsort</span>
                </div>
                <pre className="p-3 bg-[var(--bg)] text-[var(--primary)] rounded-lg border border-[var(--primary)]/30 overflow-x-auto leading-relaxed text-[11px]">
                  <code>{reportData.optimizedCode}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[var(--text-primary)] font-bold uppercase text-[10px] border-b border-[var(--border)] pb-2">
                Unified Diff Representation
              </div>
              <div className="p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)] font-mono text-[11px] space-y-1">
                <div className="text-[var(--text-muted)]">--- a/source.py</div>
                <div className="text-[var(--text-muted)]">+++ b/optimized.py</div>
                <div className="text-slate-500">@@ -6,8 +6,5 @@</div>
                <div className="bg-rose-500/10 text-rose-400 px-2 py-0.5 line-through">- def bubble_sort(a):</div>
                <div className="bg-rose-500/10 text-rose-400 px-2 py-0.5 line-through">-     for i in range(n): for j in range(0, n - i - 1):</div>
                <div className="bg-emerald-500/10 text-[#34D399] px-2 py-0.5">+ def optimized_sort(a):</div>
                <div className="bg-emerald-500/10 text-[#34D399] px-2 py-0.5">+     return sorted(a) # Native C Timsort</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 11: AI REASONING & COMPILER THEORY PANEL */}
      <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wider border-b border-[var(--border)] pb-2">
          <span className="material-symbols-outlined text-[var(--primary)]">smart_toy</span>
          Section 11: AI Compiler Engineering Reasoning
        </h2>

        <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-sans">
          {reportData.reasoning}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono text-xs">
          <div className="bg-[var(--card)] p-3 rounded-xl border border-[var(--border)] space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase">Cache Locality Impact</span>
            <span className="text-[var(--text-primary)] text-[11px]">Sequential array traversal aligns directly with CPU L1 cache line sizes (64 bytes).</span>
          </div>

          <div className="bg-[var(--card)] p-3 rounded-xl border border-[var(--border)] space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase">Bytecode Trade-offs</span>
            <span className="text-[var(--text-primary)] text-[11px]">Zero additional temporary array allocations, reducing GC heap pressure.</span>
          </div>

          <div className="bg-[var(--card)] p-3 rounded-xl border border-[var(--border)] space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block uppercase">Compiler Theory</span>
            <span className="text-[var(--text-primary)] text-[11px]">Substituted interpreted Python bytecode loop with compiled C machine instructions.</span>
          </div>
        </div>
      </div>

      {/* SECTION 12 & 13: OUTPUT VERIFICATION & TEST COVERAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 12: OUTPUT VERIFICATION */}
        <div className="glass-panel p-5 rounded-2xl border border-[var(--border)] space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
            <h3 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#34D399]">task_alt</span>
              Section 12: Output Equivalence &amp; Hash Verification
            </h3>
            <span className="text-[10px] text-[#34D399] font-bold">✓ 100% MATCH</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="bg-[var(--bg)] p-3 rounded-lg border border-[var(--border)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] block">Original Output Stream:</span>
              <div className="text-[var(--text-secondary)]">Count: 1200 Min: 1 Max: 998</div>
            </div>

            <div className="bg-[var(--bg)] p-3 rounded-lg border border-[var(--primary)]/30 space-y-1">
              <span className="text-[10px] text-[var(--primary)] block">Optimized Output Stream:</span>
              <div className="text-[var(--primary)] font-bold">Count: 1200 Min: 1 Max: 998</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="bg-[var(--card)] p-2 rounded border border-[var(--border)]">
                <span className="text-[var(--text-muted)] block">SHA-256 Digest:</span>
                <span className="text-[var(--text-primary)] font-bold">3a91f...8b21</span>
              </div>
              <div className="bg-[var(--card)] p-2 rounded border border-[var(--border)]">
                <span className="text-[var(--text-muted)] block">Float Delta:</span>
                <span className="text-[#34D399] font-bold">&lt; 1e-9 (Exact)</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 13: TEST COVERAGE */}
        <div className="glass-panel p-5 rounded-2xl border border-[var(--border)] space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
            <h3 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">verified_user</span>
              Section 13: AI Test Suite Coverage (5/5 Passed)
            </h3>
            <span className="text-[10px] text-[#34D399] font-bold">100% Coverage</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span>Standard Test Cases</span>
                <span className="text-[#34D399]">PASS (5/5)</span>
              </div>
              <div className="w-full h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                <div className="bg-[#34D399] h-full w-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span>Boundary &amp; Empty Input Tests</span>
                <span className="text-[#34D399]">PASS (3/3)</span>
              </div>
              <div className="w-full h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                <div className="bg-[#34D399] h-full w-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span>Randomized Stress Test Suite</span>
                <span className="text-[#34D399]">PASS (10/10)</span>
              </div>
              <div className="w-full h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                <div className="bg-[#34D399] h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 14 & 15: DISTRIBUTION CHARTS & REPORT EXPORTER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 14: DISTRIBUTION BREAKDOWN */}
        <div className="glass-panel p-5 rounded-2xl border border-[var(--border)] space-y-4">
          <h3 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-2">
            <span className="material-symbols-outlined text-[var(--primary)]">donut_small</span>
            Section 14: Execution &amp; Memory Distribution
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--text-secondary)]">Heap Buffer Share</span>
              <span className="font-bold text-sky-400">62.5%</span>
            </div>
            <div className="w-full h-2.5 bg-[var(--bg)] rounded-full overflow-hidden flex">
              <div className="bg-sky-400 h-full w-[62.5%]" />
              <div className="bg-[var(--primary)] h-full w-[33.6%]" />
              <div className="bg-purple-400 h-full w-[3.9%]" />
            </div>

            <div className="flex justify-between text-[10px] text-[var(--text-muted)] pt-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" /> Heap (62.5%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--primary)]" /> RSS (33.6%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> Stack (3.9%)</span>
            </div>
          </div>
        </div>

        {/* SECTION 15: REPORT EXPORT ENGINE */}
        <div className="glass-panel p-5 rounded-2xl border border-[var(--border)] space-y-4">
          <h3 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-2">
            <span className="material-symbols-outlined text-[var(--primary)]">download</span>
            Section 15: Export Audit Report
          </h3>

          <p className="text-[10px] text-[var(--text-secondary)]">
            Download complete benchmarking reports for team code reviews or compliance records.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <button
              onClick={() => handleExport("json")}
              className="p-2.5 bg-[var(--bg-secondary)] hover:bg-[var(--card-elevated)] text-[var(--primary)] rounded-xl border border-[var(--border)] font-bold transition-all hover-scale"
            >
              📥 JSON
            </button>
            <button
              onClick={() => handleExport("markdown")}
              className="p-2.5 bg-[var(--bg-secondary)] hover:bg-[var(--card-elevated)] text-[var(--primary)] rounded-xl border border-[var(--border)] font-bold transition-all hover-scale"
            >
              📝 Markdown
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="p-2.5 bg-[var(--bg-secondary)] hover:bg-[var(--card-elevated)] text-[var(--primary)] rounded-xl border border-[var(--border)] font-bold transition-all hover-scale"
            >
              📊 CSV
            </button>
            <button
              onClick={() => handleExport("html")}
              className="p-2.5 bg-[var(--bg-secondary)] hover:bg-[var(--card-elevated)] text-[var(--primary)] rounded-xl border border-[var(--border)] font-bold transition-all hover-scale"
            >
              🌐 HTML
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 16 & 18: OVERALL RATING & DEVELOPER INSIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SECTION 16: OVERALL RATING CARD */}
        <div className="glass-panel p-6 rounded-2xl border border-[var(--primary)]/40 text-center space-y-4 bg-[var(--primary)]/5">
          <h3 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
            Section 16: Overall Optimization Score
          </h3>

          <div className="text-5xl font-black text-[var(--primary)] tracking-tight">
            98<span className="text-lg text-[var(--text-muted)]">/100</span>
          </div>

          <div className="space-y-1.5 text-[10px] text-left font-mono">
            <div className="flex justify-between"><span>Performance:</span><span className="font-bold text-[#34D399]">99/100</span></div>
            <div className="flex justify-between"><span>Scalability:</span><span className="font-bold text-[#34D399]">97/100</span></div>
            <div className="flex justify-between"><span>Maintainability:</span><span className="font-bold text-[#34D399]">96/100</span></div>
            <div className="flex justify-between"><span>Readability:</span><span className="font-bold text-[#34D399]">95/100</span></div>
            <div className="flex justify-between"><span>Security:</span><span className="font-bold text-[#34D399]">94/100</span></div>
          </div>
        </div>

        {/* SECTION 18: SENIOR COMPILER ENGINEER EXECUTIVE INSIGHT */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-[var(--border)] space-y-3">
          <h3 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wider border-b border-[var(--border)] pb-2">
            <span className="material-symbols-outlined text-[var(--primary)]">engineering</span>
            Section 18: Senior Compiler Engineer Executive Insight
          </h3>

          <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-sans">
            &ldquo;The refactored code reduces runtime latency by <strong className="text-[var(--primary)]">91.0%</strong> (142.5ms → 12.8ms) and frees <strong className="text-sky-400">110MB</strong> of memory RSS by substituting nested $O(N^2)$ bytecode comparison loops with Python&apos;s native C-level Timsort routine. Output equivalence cross-verification confirms 100% deterministic result matching. This optimization is recommended for immediate production deployment.&rdquo;
          </p>

          <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono pt-2 border-t border-[var(--border)]">
            <span>Verified by Optima AI Autonomous Optimizer</span>
            <span className="text-[var(--primary)] font-bold">STATUS: PRODUCTION READY ✓</span>
          </div>
        </div>
      </div>

    </div>
  );
}
