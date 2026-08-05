"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Hero3DTerminalProps {
  onHoverChange?: (isHovered: boolean) => void;
}

export interface TerminalLogLine {
  num: string;
  text: string;
  highlight?: string;
  type?: "cmd" | "info" | "success" | "warn";
}

export interface SlideContent {
  id: string;
  step: string;
  title: string;
  badge: string;
  icon: string;
  file: string;
  status: string;
  activeMetrics: string;
  logs: TerminalLogLine[];
}

const PRELOADED_SLIDES: SlideContent[] = [
  {
    id: "ast_parsing",
    step: "SLIDE 01 / 07",
    title: "AST Parsing & Lexical Analysis",
    badge: "AST Parser v5.4",
    icon: "psychology",
    file: "lexer_parser.py",
    status: "AST Tree Built Successfully (0 Syntax Errors)",
    activeMetrics: "Confidence: 99.4%",
    logs: [
      { num: "01", text: "[00:00.01] > Initializing Lexical Analyzer for source snippet...", type: "info" },
      { num: "02", text: "[00:00.02] > Scanning 142 tokens across 3 primary functions...", type: "cmd" },
      { num: "03", text: "[00:00.03] > Language Detected: Python 3.10 (CPython dialect)", highlight: "Python 3.10", type: "info" },
      { num: "04", text: "[00:00.04] > Constructing Abstract Syntax Tree (AST)...", type: "cmd" },
      { num: "05", text: "[00:00.05] > Resolving global symbol bindings & imports...", type: "cmd" },
      { num: "06", text: "[00:00.06] > Calculating Cyclomatic Complexity Metric...", type: "info" },
      { num: "07", text: "[00:00.07] ⚠ High Complexity Found: Nested Loop O(n²)", highlight: "O(n²)", type: "warn" },
      { num: "08", text: "[00:00.08] > Memory Footprint Estimate: 124MB RSS", highlight: "124MB", type: "warn" },
      { num: "09", text: "[00:00.09] > Building AST Dependency Graph Nodes...", type: "cmd" },
      { num: "10", text: "[00:00.10] ✓ AST Parsing & Control Tree Completed", highlight: "100% Ready", type: "success" },
    ],
  },
  {
    id: "cfg_optimization",
    step: "SLIDE 02 / 07",
    title: "Control Flow Graph (CFG)",
    badge: "CFG Optimizer",
    icon: "account_tree",
    file: "cfg_analyzer.cpp",
    status: "Control Flow Graph Simplified (4 Dead Blocks Removed)",
    activeMetrics: "Blocks: 18 -> 12",
    logs: [
      { num: "01", text: "[00:00.12] > Building Basic Block Control Flow Graph (CFG)...", type: "cmd" },
      { num: "02", text: "[00:00.13] > Identified 18 basic execution blocks...", type: "info" },
      { num: "03", text: "[00:00.14] > Scanning unreachable branch conditions...", type: "cmd" },
      { num: "04", text: "[00:00.15] > Pruning dead code paths in nested conditionals...", highlight: "4 Blocks Cut", type: "info" },
      { num: "05", text: "[00:00.16] > Performing static single assignment (SSA) form...", type: "cmd" },
      { num: "06", text: "[00:00.17] > Optimizing phi-nodes across loop headers...", type: "cmd" },
      { num: "07", text: "[00:00.18] > Verifying stack frame allocation safety...", type: "info" },
      { num: "08", text: "[00:00.19] ✓ CFG Topology Reduced: 18 -> 12 Nodes", highlight: "33% Cut", type: "success" },
      { num: "09", text: "[00:00.20] ✓ Dataflow Control Graph Compacted", highlight: "Verified", type: "success" },
    ],
  },
  {
    id: "loop_fusion",
    step: "SLIDE 03 / 07",
    title: "Loop Fusion & AI Reduction",
    badge: "Groq Llama 3.3 70B",
    icon: "auto_awesome",
    file: "loop_fuser.rs",
    status: "Algorithmic Reduction Applied: O(n²) -> O(n)",
    activeMetrics: "Complexity: O(n)",
    logs: [
      { num: "01", text: "[00:00.22] > Fusing sequential array iteration loops...", highlight: "Loop Fusion", type: "cmd" },
      { num: "02", text: "[00:00.23] > Eliminating intermediate allocation vectors...", type: "info" },
      { num: "03", text: "[00:00.24] > Converting quadratic search into O(n) Hash Set...", highlight: "Hash Set", type: "cmd" },
      { num: "04", text: "[00:00.25] > Inlining critical mathematical helper functions...", type: "cmd" },
      { num: "05", text: "[00:00.26] > Applying constant folding & algebraic reduction...", type: "info" },
      { num: "06", text: "[00:00.27] > Removing redundant heap allocation calls...", highlight: "-88% Heap", type: "info" },
      { num: "07", text: "[00:00.28] ✓ Algorithmic Reduction: O(n²) -> O(n)", highlight: "O(n)", type: "success" },
      { num: "08", text: "[00:00.29] ✓ AI Refactoring Confidence: 99.1%", highlight: "99.1%", type: "success" },
    ],
  },
  {
    id: "llvm_backend",
    step: "SLIDE 04 / 07",
    title: "LLVM Backend & SIMD Vectorization",
    badge: "LLVM 17 / GCC 13.2",
    icon: "memory",
    file: "llvm_codegen.rs",
    status: "Native x86_64 Machine Binary Emitted (-O3 Fast-Math)",
    activeMetrics: "Target: AVX-512",
    logs: [
      { num: "01", text: "[00:00.31] > Lowering AST to LLVM Intermediate Representation...", type: "cmd" },
      { num: "02", text: "[00:00.32] > Invoking LLVM SIMD auto-vectorization pass...", highlight: "AVX-512", type: "info" },
      { num: "03", text: "[00:00.33] > Unrolling tight iteration loops (factor = 4)...", type: "cmd" },
      { num: "04", text: "[00:00.34] > Performing register allocation & alignment...", type: "cmd" },
      { num: "05", text: "[00:00.35] > EmittingELF x86_64 native machine code...", type: "info" },
      { num: "06", text: "[00:00.36] ✓ Zero-Cost Abstractions Verified", highlight: "0 Cost", type: "success" },
      { num: "07", text: "[00:00.37] ✓ Binary Compilation Complete (0 Warnings)", highlight: "Clean Build", type: "success" },
    ],
  },
  {
    id: "benchmark_audit",
    step: "SLIDE 05 / 07",
    title: "Benchmark Latency Audit",
    badge: "VTune / Piston Exec",
    icon: "speed",
    file: "benchmark_results.json",
    status: "Wall-Clock Benchmark Confirmed (+91.0% Faster)",
    activeMetrics: "Speedup: 11.1x",
    logs: [
      { num: "01", text: "[00:00.39] > Spawning 10,000 microbenchmark iterations...", type: "cmd" },
      { num: "02", text: "[00:00.40] > Original Binary Wall-Clock: 142.5ms", highlight: "142.5ms", type: "warn" },
      { num: "03", text: "[00:00.41] > Optimized Binary Wall-Clock: 12.8ms", highlight: "12.8ms", type: "success" },
      { num: "04", text: "[00:00.42] > Peak RSS Memory: 124MB -> 14MB", highlight: "-88.7%", type: "info" },
      { num: "05", text: "[00:00.43] > Throughput: 7,017 ops/sec -> 78,125 ops/sec", type: "info" },
      { num: "06", text: "[00:00.44] ✓ Net Wall-Clock Speedup: +91.0% Faster", highlight: "+91.0%", type: "success" },
      { num: "07", text: "[00:00.45] ✓ Multi-Runtime Latency Audit Passed", highlight: "Verified", type: "success" },
    ],
  },
  {
    id: "ai_insights",
    step: "SLIDE 06 / 07",
    title: "AI Copilot Insights & Explanation",
    badge: "Speed Copilot AI",
    icon: "smart_toy",
    file: "explanation_report.md",
    status: "Automated Developer Explanation Report Generated",
    activeMetrics: "Copilot: Ready",
    logs: [
      { num: "01", text: "[00:00.47] > Generating automated developer insight report...", type: "info" },
      { num: "02", text: "[00:00.48] > Replaced nested quadratic loops with single-pass hash map.", type: "cmd" },
      { num: "03", text: "[00:00.49] > Zero heap allocations inside critical path loops.", type: "info" },
      { num: "04", text: "[00:00.50] > Improved variable naming & strict type safety.", type: "cmd" },
      { num: "05", text: "[00:00.51] > Generated inline JSDoc/RustDoc documentation.", type: "info" },
      { num: "06", text: "[00:00.52] ✓ Production Ready Refactored Source Generated", highlight: "Complete", type: "success" },
      { num: "07", text: "[00:00.53] ✓ Developer Summary Exported to Workspace", highlight: "Ready", type: "success" },
    ],
  },
  {
    id: "algorand_settlement",
    step: "SLIDE 07 / 07",
    title: "Algorand x402 Blockchain Settlement",
    badge: "Algorand Testnet",
    icon: "verified_user",
    file: "receipt_0x8f2d.alg",
    status: "Algorand x402 Immutable Receipt Verified",
    activeMetrics: "Settled: True",
    logs: [
      { num: "01", text: "[00:00.55] > Constructing SHA-256 cryptographic verification digest...", type: "cmd" },
      { num: "02", text: "[00:00.56] > Constructing Algorand x402 micro-payment payload...", type: "info" },
      { num: "03", text: "[00:00.57] > Submitting receipt to Algorand Testnet node...", type: "cmd" },
      { num: "04", text: "[00:00.58] > Transaction Hash: 0x8f2d91b4e3a092c18...", highlight: "0x8f2d...e3a0", type: "info" },
      { num: "05", text: "[00:00.59] > Block Height: 31,566,704 | Fee: 0.001 ALGO", type: "info" },
      { num: "06", text: "[00:00.60] ✓ On-Chain Immutable Settlement Verified", highlight: "Settled", type: "success" },
      { num: "07", text: "[00:00.61] ✓ Blockchain Receipt Logged to Cloud Storage", highlight: "Verified", type: "success" },
    ],
  },
];

export function Hero3DTerminal({ onHoverChange }: Hero3DTerminalProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [visibleLineCount, setVisibleLineCount] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);

  const slide = PRELOADED_SLIDES[activeSlide] || PRELOADED_SLIDES[0];
  const totalLines = slide.logs.length;

  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lineStreamTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Advance to next slide cleanly
  const advanceSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % PRELOADED_SLIDES.length);
    setVisibleLineCount(1);
    setProgressPercent(0);
  }, []);

  // Manage 2000ms Autoplay & Progress Capsules Fill
  useEffect(() => {
    if (isHovered) {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const startTime = Date.now();

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / 2000) * 100);
      setProgressPercent(pct);
    }, 30);

    autoplayTimerRef.current = setInterval(() => {
      advanceSlide();
    }, 2000);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isHovered, advanceSlide, activeSlide]);

  // Line-by-Line Streaming Typewriter Effect (120ms per line)
  useEffect(() => {
    if (isHovered) {
      if (lineStreamTimerRef.current) clearInterval(lineStreamTimerRef.current);
      return;
    }

    lineStreamTimerRef.current = setInterval(() => {
      setVisibleLineCount((prev) => {
        if (prev < totalLines) return prev + 1;
        return prev;
      });
    }, 120);

    return () => {
      if (lineStreamTimerRef.current) clearInterval(lineStreamTimerRef.current);
    };
  }, [isHovered, activeSlide, totalLines]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverChange?.(false);
  };

  // Currently displayed lines up to visibleLineCount (always fallback if 0)
  const displayedLogs = slide.logs.slice(0, visibleLineCount);

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-4 select-none overflow-visible">
      
      {/* 720px x 420px Outer Container */}
      <div className="relative w-full max-w-[720px] h-[380px] sm:h-[410px] md:h-[430px] flex justify-center items-center">
        
        {/* Static Background Finder Windows (Parallel macOS Stack Effect) */}
        <div className="absolute left-[80px] top-[-52px] w-full h-full rounded-2xl bg-[var(--card)] border border-[var(--border)] scale-[0.91] opacity-15 shadow-[0_8px_30px_rgba(0,0,0,0.3)] pointer-events-none" />
        <div className="absolute left-[54px] top-[-36px] w-full h-full rounded-2xl bg-[var(--card)] border border-[var(--border)] scale-[0.94] opacity-28 shadow-[0_8px_30px_rgba(0,0,0,0.3)] pointer-events-none" />
        <div className="absolute left-[28px] top-[-18px] w-full h-full rounded-2xl bg-[var(--card)] border border-[var(--border)] scale-[0.97] opacity-45 shadow-[0_8px_30px_rgba(0,0,0,0.3)] pointer-events-none" />

        {/* PERMANENT MAIN TERMINAL WINDOW FRAME (NEVER REMOUNTS) */}
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`relative z-10 w-full h-full rounded-2xl overflow-hidden bg-[var(--card)] transition-all duration-300 transform-gpu flex flex-col justify-between ${
            isHovered
              ? "border border-[#2DD4BF] shadow-[0_16px_60px_rgba(0,0,0,0.55),0_0_45px_rgba(45,212,191,0.18)] scale-[1.01]"
              : "border border-[#2DD4BF]/60 shadow-[0_12px_50px_rgba(0,0,0,0.45),0_0_40px_rgba(45,212,191,0.08)] scale-100"
          }`}
        >
          {/* HEADER (STATIC - READS CURRENT SLIDE METADATA - NEVER REMOUNTS) */}
          <div className="p-4 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between font-mono text-xs relative">
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#2DD4BF] to-transparent pointer-events-none"
            />

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] opacity-80" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] animate-pulse" />
              <span className="ml-3 text-[var(--text-primary)] font-bold flex items-center gap-2 text-xs tracking-tight">
                <span className="material-symbols-outlined text-sm text-[var(--primary)]">
                  {slide.icon}
                </span>
                {slide.title}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[var(--text-secondary)] font-mono hidden sm:inline">
                {slide.file}
              </span>
              <span className="px-3 py-0.5 rounded-md text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30">
                {slide.badge}
              </span>
            </div>
          </div>

          {/* TERMINAL BODY (min-height 270px - AnimatePresence INSIDE BODY ONLY) */}
          <div className="p-5 font-mono text-xs leading-relaxed space-y-2 text-left h-[calc(100%-90px)] overflow-y-auto select-text min-h-[270px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-2"
              >
                <div className="text-[10px] text-[var(--primary)] font-bold tracking-widest uppercase mb-1">
                  {slide.step}
                </div>

                {/* Streamed Log Lines */}
                {displayedLogs.map((log) => (
                  <div key={log.num} className="flex items-center gap-3">
                    <span className="text-[var(--text-muted)] text-[10px] w-6 text-right select-none font-mono">
                      {log.num}
                    </span>
                    <span className="text-[var(--text-primary)] font-medium text-xs">
                      {log.text.split(log.highlight || "")[0]}
                      {log.highlight && (
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded-sm ml-1 ${
                            log.type === "warn"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : log.type === "success"
                              ? "bg-emerald-500/10 text-[#34D399] border border-emerald-500/20"
                              : "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                          }`}
                        >
                          {log.highlight}
                        </span>
                      )}
                    </span>
                  </div>
                ))}

                {/* Fallback if list is empty */}
                {displayedLogs.length === 0 && (
                  <div className="text-sky-400 font-semibold animate-pulse">
                    &gt; Initializing Optima AI Compiler Pipeline...
                  </div>
                )}

                {/* Continuous Blinking Cursor ▋ Line */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[var(--text-muted)] text-[10px] w-6 text-right select-none font-mono">
                    &gt;&gt;
                  </span>
                  <span className="text-[var(--primary)] font-bold flex items-center gap-1.5">
                    <span className="animate-pulse font-extrabold text-sm">▋</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">
                      {isHovered ? "paused" : "streaming telemetry..."}
                    </span>
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* FOOTER (STATIC - READS CURRENT SLIDE METADATA - NEVER REMOUNTS) */}
          <div className="p-3 bg-[var(--bg-secondary)] border-t border-[var(--border)] font-mono text-[11px] text-[var(--text-secondary)] flex justify-between items-center px-5">
            <span className="truncate max-w-[70%]">{slide.status}</span>
            <span className="text-[var(--primary)] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-ping" />
              <span>{slide.activeMetrics}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Progress Capsule Indicators (2000ms Fill Per Slide) */}
      <div className="flex items-center gap-2 mt-6 relative z-30">
        {PRELOADED_SLIDES.map((_, idx) => {
          const isActive = idx === activeSlide;
          const isPassed = idx < activeSlide;

          return (
            <button
              key={idx}
              onClick={() => {
                setActiveSlide(idx);
                setVisibleLineCount(1);
                setProgressPercent(0);
              }}
              className="relative w-8 h-2 rounded-full bg-[var(--border)] overflow-hidden transition-all duration-300 hover:bg-[var(--primary)]/40"
            >
              {isActive && (
                <div
                  className="h-full bg-[var(--primary)] shadow-[0_0_8px_rgba(45,212,191,0.8)] transition-all duration-75 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              )}
              {isPassed && <div className="w-full h-full bg-[var(--primary)]/60" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
