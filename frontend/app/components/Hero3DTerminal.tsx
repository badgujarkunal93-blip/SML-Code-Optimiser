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
    id: "codebase_detection",
    step: "SLIDE 01 / 07",
    title: "Codebase Detection",
    badge: "Optima CLI v2.4",
    icon: "terminal",
    file: "optima_scan.py",
    status: "Codebase Loaded Successfully (42 Files Discovered)",
    activeMetrics: "Scan: Complete",
    logs: [
      { num: "01", text: "$ optima scan ./project", type: "cmd" },
      { num: "02", text: "Scanning project directory structure...", type: "info" },
      { num: "03", text: "✓ Codebase detected", highlight: "Codebase detected", type: "success" },
      { num: "04", text: "✓ Language: Python 3.10", highlight: "Python 3.10", type: "info" },
      { num: "05", text: "✓ Files discovered: 42 (Source: 31, Tests: 8)", highlight: "42", type: "info" },
      { num: "06", text: "✓ Dependencies resolved: 12 packages", highlight: "12 packages", type: "info" },
      { num: "07", text: "$ tree -L 2 --dirsfirst", type: "cmd" },
      { num: "08", text: "project/ ├── src/ ├── tests/ ├── requirements.txt", type: "info" },
      { num: "09", text: ">> codebase loaded into memory", highlight: "loaded", type: "success" },
    ],
  },
  {
    id: "source_analysis",
    step: "SLIDE 02 / 07",
    title: "Static Source Analysis",
    badge: "Static Analyzer",
    icon: "search",
    file: "src/analyzer.py",
    status: "31 Source Files & 184 Functions Indexed",
    activeMetrics: "Indexed: 100%",
    logs: [
      { num: "01", text: "$ optima analyze src/", type: "cmd" },
      { num: "02", text: "Loading source files into static analyzer...", type: "info" },
      { num: "03", text: "[01/31] src/main.py -> [02/31] src/utils.py", type: "info" },
      { num: "04", text: "[03/31] src/sort.py -> [04/31] src/parser.py", type: "info" },
      { num: "05", text: "Building symbol dependency graph...", type: "cmd" },
      { num: "06", text: "✓ 31 source files indexed", highlight: "31 source files", type: "success" },
      { num: "07", text: "✓ 12 external dependencies resolved", type: "info" },
      { num: "08", text: "✓ 184 functions & 26 classes detected", highlight: "184 functions", type: "info" },
      { num: "09", text: ">> static analysis complete", highlight: "complete", type: "success" },
    ],
  },
  {
    id: "ast_analysis",
    step: "SLIDE 03 / 07",
    title: "AST & Bottleneck Analysis",
    badge: "Groq AST Engine",
    icon: "psychology",
    file: "ast_tree.json",
    status: "Optimization Candidates Identified (Confidence: 98.8%)",
    activeMetrics: "Confidence: 98.8%",
    logs: [
      { num: "01", text: "$ optima ast --analyze", type: "cmd" },
      { num: "02", text: "Parsing source tree & generating AST graph...", type: "info" },
      { num: "03", text: "✓ Python AST generated (184 basic nodes)", highlight: "AST generated", type: "success" },
      { num: "04", text: "✓ Control Flow Graph & Call Graph constructed", type: "info" },
      { num: "05", text: "Detected optimization targets:", type: "cmd" },
      { num: "06", text: "  → O(n²) quadratic sorting loop in src/sort.py", highlight: "O(n²)", type: "warn" },
      { num: "07", text: "  → Redundant intermediate list allocations", highlight: "allocations", type: "warn" },
      { num: "08", text: "  → Unreachable branch conditions in nested loops", type: "info" },
      { num: "09", text: ">> 5 optimization candidates identified (AI: 98.8%)", highlight: "98.8%", type: "success" },
    ],
  },
  {
    id: "ai_optimization",
    step: "SLIDE 04 / 07",
    title: "AI Code Transformations",
    badge: "Llama-3.3 70B",
    icon: "auto_awesome",
    file: "optimizer_core.rs",
    status: "AST Reduced: 184 -> 137 Nodes (Code Paths Cut 42 -> 31)",
    activeMetrics: "Nodes: -25.5%",
    logs: [
      { num: "01", text: "$ optima optimize --target performance", type: "cmd" },
      { num: "02", text: "Applying AST transformations & refactoring...", type: "info" },
      { num: "03", text: "[01] Loop optimization ..................... OK", highlight: "OK", type: "success" },
      { num: "04", text: "[02] Dead code elimination .................. OK", highlight: "OK", type: "success" },
      { num: "05", text: "[03] Memory allocation pruning .............. OK", highlight: "OK", type: "success" },
      { num: "06", text: "[04] Function inlining & constant folding ... OK", highlight: "OK", type: "success" },
      { num: "07", text: "[05] Algorithm replacement (O(n²) -> O(n log n))", highlight: "O(n log n)", type: "success" },
      { num: "08", text: "AST Node Reduction: 184 nodes → 137 nodes", highlight: "184 → 137", type: "info" },
      { num: "09", text: ">> optimized source generated", highlight: "generated", type: "success" },
    ],
  },
  {
    id: "code_generation",
    step: "SLIDE 05 / 07",
    title: "Optimized Code Generation",
    badge: "Compiler Frontend",
    icon: "code",
    file: "src/sort.py",
    status: "Optimized Build Ready (Syntax & Types Validated)",
    activeMetrics: "Build: Ready",
    logs: [
      { num: "01", text: "$ optima build --optimized", type: "cmd" },
      { num: "02", text: "Generating optimized production source for src/sort.py...", type: "info" },
      { num: "03", text: "  - def bubble_sort(a):  # O(n²) quadratic bottleneck", highlight: "- bubble_sort", type: "warn" },
      { num: "04", text: "  + def quick_sort(a):   # O(n log n) implementation", highlight: "+ quick_sort", type: "success" },
      { num: "05", text: "Complexity improvement: O(n²) → O(n log n)", highlight: "O(n log n)", type: "success" },
      { num: "06", text: "✓ Refactored source code emitted", type: "info" },
      { num: "07", text: "✓ AST syntax validated & type checks passed", highlight: "PASS", type: "success" },
      { num: "08", text: ">> optimized build ready", highlight: "ready", type: "success" },
    ],
  },
  {
    id: "execution_benchmark",
    step: "SLIDE 06 / 07",
    title: "Piston Execution & Benchmark",
    badge: "Piston Sandbox",
    icon: "speed",
    file: "benchmark.json",
    status: "Wall-Clock Benchmark Confirmed (+51% Speedup)",
    activeMetrics: "Speedup: +51%",
    logs: [
      { num: "01", text: "$ optima benchmark --iterations 10000", type: "cmd" },
      { num: "02", text: "Executing isolated multi-runtime sandbox test...", type: "info" },
      { num: "03", text: "Original Binary Runtime ... 104 ms  (42 MB RSS)", highlight: "104 ms", type: "warn" },
      { num: "04", text: "Optimized Binary Runtime ..  51 ms  (31 MB RSS)", highlight: "51 ms", type: "success" },
      { num: "05", text: "Performance Delta: +51% faster | -26% memory", highlight: "+51% faster", type: "success" },
      { num: "06", text: "✓ Output equivalence verified (100% match)", highlight: "100% match", type: "success" },
      { num: "07", text: "✓ 8/8 boundary test cases passed", highlight: "PASSED", type: "success" },
      { num: "08", text: ">> benchmark suite completed", highlight: "completed", type: "success" },
    ],
  },
  {
    id: "final_result",
    step: "SLIDE 07 / 07",
    title: "Verification & Settlement",
    badge: "Algorand x402",
    icon: "verified",
    file: "verification.log",
    status: "Optimization Complete (+74.2% Net Runtime Improvement)",
    activeMetrics: "Status: Verified",
    logs: [
      { num: "01", text: "$ optima verify", type: "cmd" },
      { num: "02", text: "Running final verification & micropayment settlement...", type: "info" },
      { num: "03", text: "✓ 42/42 files processed | 128/128 tests passed", highlight: "128/128 passed", type: "success" },
      { num: "04", text: "✓ Output equivalence verified & AST validated", type: "info" },
      { num: "05", text: "✓ Net Runtime Speedup: +74.2% wall-clock boost", highlight: "+74.2%", type: "success" },
      { num: "06", text: "✓ Algorand x402 Blockchain Receipt: 0x8f2d...e3a0", highlight: "Algorand x402", type: "info" },
      { num: "07", text: "OPTIMIZATION SUCCESSFUL", highlight: "SUCCESSFUL", type: "success" },
      { num: "08", text: ">> ready for workspace deployment", highlight: "ready", type: "success" },
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
    <div className="relative w-full flex flex-col items-center justify-center py-2 lg:py-0 pt-10 lg:pt-12 select-none overflow-visible">
      
      {/* Outer Container with Viewport Responsive Height */}
      <div className="relative w-full max-w-[720px] h-[350px] sm:h-[390px] md:h-[410px] lg:h-[clamp(300px,44vh,420px)] flex justify-center items-center">
        
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
              ? "border border-[var(--primary)] shadow-[0_16px_60px_var(--shadow-color),0_0_45px_var(--border-glow)] scale-[1.01]"
              : "border border-[var(--terminal-border)] shadow-[0_12px_50px_var(--shadow-color)] scale-100"
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

          {/* TERMINAL BODY (Flex-1 with min-h-0 & overflow-y-auto to contain logs cleanly inside window) */}
          <div className="p-4 sm:p-5 font-mono text-xs leading-relaxed space-y-2 text-left flex-1 min-h-0 overflow-y-auto select-text">
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
                              ? "bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30"
                              : log.type === "success"
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-[#34D399] border border-emerald-500/30"
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
                  <div className="text-sky-600 dark:text-sky-400 font-semibold animate-pulse">
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
      <div className="flex items-center gap-2 mt-4 lg:mt-5 relative z-30">
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
