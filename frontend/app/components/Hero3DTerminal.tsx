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
    title: "Contract & Codebase Scan",
    badge: "Optima CLI v2.4",
    icon: "terminal",
    file: "contract.teal",
    status: "Contract Loaded Successfully (TEAL / PyTeal AVM 10)",
    activeMetrics: "Scan: Complete",
    logs: [
      { num: "01", text: "$ optima scan contract.teal", type: "cmd" },
      { num: "02", text: "Scanning TEAL smart contract structure...", type: "info" },
      { num: "03", text: "✓ Contract detected: Algorand AVM 10 TEAL", highlight: "Algorand AVM 10", type: "success" },
      { num: "04", text: "✓ Opcode count: 42 opcodes (Stack ops: 18)", highlight: "42 opcodes", type: "info" },
      { num: "05", text: "✓ Global/Local state slots: 4 slots initialized", highlight: "4 slots", type: "info" },
      { num: "06", text: "✓ ABI interfaces: 3 approval methods", type: "info" },
      { num: "07", text: "$ optima teal-inspect --verbose", type: "cmd" },
      { num: "08", text: "#pragma version 10; txn ApplicationID; btoi", type: "info" },
      { num: "09", text: ">> TEAL bytecode loaded into memory", highlight: "loaded", type: "success" },
    ],
  },
  {
    id: "source_analysis",
    step: "SLIDE 02 / 07",
    title: "Static Opcode Analysis",
    badge: "Static Analyzer",
    icon: "search",
    file: "src/analyzer.py",
    status: "Opcode Flow & Stack Depth Indexed",
    activeMetrics: "Indexed: 100%",
    logs: [
      { num: "01", text: "$ optima analyze contract.teal", type: "cmd" },
      { num: "02", text: "Analyzing opcode stack operations...", type: "info" },
      { num: "03", text: "[01/12] AppGlobalGet -> [02/12] Btoi conversion", type: "info" },
      { num: "04", text: "[03/12] Conditional branches -> [04/12] Stack Dups", type: "info" },
      { num: "05", text: "Building opcode dependency graph...", type: "cmd" },
      { num: "06", text: "✓ 42 AVM opcodes indexed", highlight: "42 AVM opcodes", type: "success" },
      { num: "07", text: "✓ Stack depth max: 6 levels", type: "info" },
      { num: "08", text: "✓ Redundant pushes/pops detected: 8 occurrences", highlight: "8 occurrences", type: "warn" },
      { num: "09", text: ">> static opcode analysis complete", highlight: "complete", type: "success" },
    ],
  },
  {
    id: "ast_analysis",
    step: "SLIDE 03 / 07",
    title: "SLM Code Smell Analysis",
    badge: "SLM Analyzer",
    icon: "psychology",
    file: "slm_smells.json",
    status: "Optimization Candidates Identified (Confidence: 98.8%)",
    activeMetrics: "Confidence: 98.8%",
    logs: [
      { num: "01", text: "$ optima slm --detect-smells", type: "cmd" },
      { num: "02", text: "Running Small Language Model code smell classifier...", type: "info" },
      { num: "03", text: "✓ SLM opcode smell detection complete", highlight: "SLM complete", type: "success" },
      { num: "04", text: "✓ Control Flow & Branching Graph constructed", type: "info" },
      { num: "05", text: "Detected optimization targets:", type: "cmd" },
      { num: "06", text: "  → Redundant btoi/itob stack conversions in TEAL", highlight: "TEAL", type: "warn" },
      { num: "07", text: "  → Unnecessary dup ops before AppGlobalGet", highlight: "dup ops", type: "warn" },
      { num: "08", text: "  → Dead conditional branch in ApprovalProgram", type: "info" },
      { num: "09", text: ">> 6 optimization candidates identified (SLM: 98.8%)", highlight: "98.8%", type: "success" },
    ],
  },
  {
    id: "ai_optimization",
    step: "SLIDE 04 / 07",
    title: "AI Code Transformations",
    badge: "AI Engine",
    icon: "auto_awesome",
    file: "optimizer_core.rs",
    status: "Opcodes Reduced: 42 -> 34 (Stack Depth Cut 6 -> 4)",
    activeMetrics: "Opcodes: -19%",
    logs: [
      { num: "01", text: "$ optima optimize --target teal", type: "cmd" },
      { num: "02", text: "Applying AST transformations & opcode pruning...", type: "info" },
      { num: "03", text: "[01] Redundant dup/pop elimination ......... OK", highlight: "OK", type: "success" },
      { num: "04", text: "[02] Inlining byte constants ............... OK", highlight: "OK", type: "success" },
      { num: "05", text: "[03] Dead branch pruning .................... OK", highlight: "OK", type: "success" },
      { num: "06", text: "[04] Stack depth optimization ............. OK", highlight: "OK", type: "success" },
      { num: "07", text: "[05] Algorithmic loop refactoring (O(n²) -> O(n))", highlight: "O(n)", type: "success" },
      { num: "08", text: "Opcode Reduction: 42 opcodes → 34 opcodes", highlight: "42 → 34", type: "info" },
      { num: "09", text: ">> optimized contract generated", highlight: "generated", type: "success" },
    ],
  },
  {
    id: "code_generation",
    step: "SLIDE 05 / 07",
    title: "Optimized Contract Output",
    badge: "Compiler Frontend",
    icon: "code",
    file: "contract_opt.teal",
    status: "Optimized TEAL Ready (AVM 10 Validated)",
    activeMetrics: "Build: Ready",
    logs: [
      { num: "01", text: "$ optima build --teal", type: "cmd" },
      { num: "02", text: "Generating optimized TEAL bytecode for contract.teal...", type: "info" },
      { num: "03", text: "  - app_global_get; dup; btoi;  # Unnecessary dup", highlight: "- dup", type: "warn" },
      { num: "04", text: "  + app_global_get; btoi;       # Inlined stack op", highlight: "+ inlined", type: "success" },
      { num: "05", text: "Execution cost improvement: -19% AVM opcode budget", highlight: "-19% AVM", type: "success" },
      { num: "06", text: "✓ Refactored TEAL bytecode emitted", type: "info" },
      { num: "07", text: "✓ AVM opcode syntax validated & type checks passed", highlight: "PASS", type: "success" },
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
    status: "Wall-Clock Benchmark Confirmed (+74.2% Speedup)",
    activeMetrics: "Speedup: +74.2%",
    logs: [
      { num: "01", text: "$ optima benchmark --iterations 1000", type: "cmd" },
      { num: "02", text: "Executing isolated multi-runtime sandbox test...", type: "info" },
      { num: "03", text: "Original Contract Runtime .. 142.5 ms (124 MB)", highlight: "142.5 ms", type: "warn" },
      { num: "04", text: "Optimized Contract Runtime .  12.8 ms ( 14 MB)", highlight: "12.8 ms", type: "success" },
      { num: "05", text: "Performance Delta: +74.2% faster | -88% memory", highlight: "+74.2% faster", type: "success" },
      { num: "06", text: "✓ Output equivalence verified (100% match)", highlight: "100% match", type: "success" },
      { num: "07", text: "✓ Multi-case boundary tests passed", highlight: "PASSED", type: "success" },
      { num: "08", text: ">> benchmark suite completed", highlight: "completed", type: "success" },
    ],
  },
  {
    id: "final_result",
    step: "SLIDE 07 / 07",
    title: "Verification & x402 Settlement",
    badge: "Algorand x402",
    icon: "verified",
    file: "verification.log",
    status: "Optimization Complete (+74.2% Net Runtime Improvement)",
    activeMetrics: "Status: Verified",
    logs: [
      { num: "01", text: "$ optima verify", type: "cmd" },
      { num: "02", text: "Running final verification & x402 settlement...", type: "info" },
      { num: "03", text: "✓ 402 Payment Required: 0.001 USDC", highlight: "0.001 USDC", type: "info" },
      { num: "04", text: "✓ Algorand Testnet Tx: dev_bypass_tx_req_178...", highlight: "Algorand Testnet", type: "success" },
      { num: "05", text: "✓ Net Runtime Speedup: +74.2% wall-clock boost", highlight: "+74.2%", type: "success" },
      { num: "06", text: "✓ Plausible x402 Facilitator Settlement Confirmed", highlight: "Plausible x402", type: "info" },
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
