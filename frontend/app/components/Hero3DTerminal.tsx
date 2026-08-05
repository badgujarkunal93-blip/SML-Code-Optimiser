"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, Variants } from "framer-motion";

interface Hero3DTerminalProps {
  onHoverChange?: (isHovered: boolean) => void;
  resultMetrics?: {
    originalTimeMs?: number;
    optimizedTimeMs?: number;
    improvementPct?: number;
    originalComplexity?: string;
    optimizedComplexity?: string;
  };
}

export function Hero3DTerminal({ onHoverChange, resultMetrics }: Hero3DTerminalProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse position tracking for 3D tilt (rotateX ±4°, rotateY ±4°)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics setup (stiffness: 170, damping: 20, mass: 0.8 as requested)
  const springConfig = { stiffness: 170, damping: 20, mass: 0.8 };
  const tiltRotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), springConfig);
  const tiltRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverChange?.(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleCopyLogs = () => {
    const logs = `> Parsing AST...
> Building CFG...
> Detecting bottleneck...
> Applying optimization...
✓ Complexity Reduced
✓ Memory Optimized
✓ Build Complete`;
    navigator.clipboard.writeText(logs);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -8 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 170, damping: 20 },
    },
  };

  return (
    <div className="relative w-full flex justify-center items-center py-4">
      {/* 3D Stack Outer Container */}
      <motion.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: tiltRotateX,
          rotateY: tiltRotateY,
          transformStyle: "preserve-3d",
          perspective: "1800px",
        }}
        animate={{
          y: isHovered ? -18 : [0, -4, 0, 4, 0],
          scale: isHovered ? 1.03 : 1,
          rotateX: isHovered ? 2 : 0,
          rotateY: isHovered ? -2 : 0,
        }}
        transition={
          isHovered
            ? { type: "spring", stiffness: 170, damping: 20, mass: 0.8 }
            : { y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }
        }
        className="relative w-[340px] sm:w-[440px] md:w-[480px] h-[340px] sm:h-[380px] cursor-pointer select-none transform-gpu will-change-transform"
      >
        {/* Soft Layered Ambient Backdrop Glow */}
        <motion.div
          animate={{
            scale: isHovered ? 1.1 : 1,
            opacity: isHovered ? 0.25 : 0.12,
          }}
          transition={{ type: "spring", stiffness: 170, damping: 20 }}
          className="absolute inset-0 bg-gradient-to-tr from-[#2DD4BF]/20 via-teal-500/10 to-indigo-500/10 blur-3xl pointer-events-none rounded-full"
        />

        {/* LAYER 3: Back Analytics Card Silhouette (Desktop/Tablet) */}
        <motion.div
          animate={{
            x: isHovered ? 115 : 95,
            y: isHovered ? -48 : -35,
            rotate: isHovered ? 8 : 7,
            scale: isHovered ? 0.96 : 0.95,
          }}
          transition={{ type: "spring", stiffness: 170, damping: 20 }}
          style={{
            transformStyle: "preserve-3d",
            transform: "translateZ(0px)",
          }}
          className="hidden md:block absolute right-0 top-0 w-[420px] h-[280px] rounded-2xl border border-[#3c4a46]/20 bg-[#0e1513]/90 shadow-xl pointer-events-none opacity-10 backdrop-blur-[4px] transform-gpu will-change-transform"
        >
          {/* Abstract Blurred Silhouette (No readable competing text) */}
          <div className="p-6 h-full flex flex-col justify-between">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700/50" />
            </div>
            <div className="space-y-3 opacity-30">
              <div className="h-3 w-3/4 bg-slate-600/40 rounded" />
              <div className="h-3 w-1/2 bg-slate-600/40 rounded" />
              <div className="h-3 w-5/6 bg-slate-600/40 rounded" />
            </div>
          </div>
        </motion.div>

        {/* LAYER 2: Middle Feature Card Silhouette (Desktop/Tablet) */}
        <motion.div
          animate={{
            x: isHovered ? 70 : 55,
            y: isHovered ? -28 : -18,
            rotate: isHovered ? 5 : 4,
            scale: isHovered ? 0.99 : 0.98,
          }}
          transition={{ type: "spring", stiffness: 170, damping: 20 }}
          style={{
            transformStyle: "preserve-3d",
            transform: "translateZ(15px)",
          }}
          className="hidden sm:block absolute right-0 top-0 w-[430px] h-[290px] rounded-2xl border border-[#3c4a46]/30 bg-[#161d1b]/95 shadow-2xl pointer-events-none opacity-18 backdrop-blur-[2px] transform-gpu will-change-transform"
        >
          {/* Abstract Blurred Silhouette (No readable competing text) */}
          <div className="p-6 h-full flex flex-col justify-between">
            <div className="flex justify-between items-center opacity-40">
              <div className="h-3.5 w-24 bg-teal-500/30 rounded" />
              <div className="h-3.5 w-12 bg-slate-600/40 rounded" />
            </div>
            <div className="space-y-2.5 opacity-30">
              <div className="h-3 w-2/3 bg-slate-500/40 rounded" />
              <div className="h-3 w-1/2 bg-slate-500/40 rounded" />
            </div>
          </div>
        </motion.div>

        {/* LAYER 1: Front Main Terminal Window (Primary Focal Point) */}
        <motion.div
          style={{
            transformStyle: "preserve-3d",
            transform: "translateZ(50px)",
          }}
          className={`absolute left-0 top-0 w-full ${
            expandedView ? "h-[360px]" : "h-[310px]"
          } rounded-2xl overflow-hidden border transition-all duration-300 ${
            isHovered
              ? "border-[#2DD4BF]/60 shadow-[0_35px_70px_rgba(0,0,0,0.28),0_18px_35px_rgba(0,0,0,0.22),0_0_40px_rgba(38,255,218,0.10)]"
              : "border-[#2DD4BF]/30 shadow-[0_35px_70px_rgba(0,0,0,0.28),0_18px_35px_rgba(0,0,0,0.22),0_0_40px_rgba(38,255,218,0.06)]"
          } bg-[#0F172A]/95 backdrop-blur-xl z-30 transform-gpu will-change-transform`}
        >
          {/* Diagonal Reflection Sheen Sweep (Every 8s idle, stops on hover) */}
          {!isHovered && (
            <motion.div
              animate={{
                x: ["-100%", "220%"],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                repeatDelay: 5.8,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-12 pointer-events-none"
            />
          )}

          {/* Window Header Bar with macOS Style Controls */}
          <div className="p-3.5 bg-[#0A0F1D] border-b border-[#3c4a46]/40 flex items-center justify-between relative z-10 font-mono text-xs">
            <div className="flex items-center gap-2">
              {/* macOS Status LEDs */}
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] opacity-70 shadow-sm" />
              {/* Green LED pulsing every 2s */}
              <span className="w-3 h-3 rounded-full bg-[#27C93F] animate-pulse shadow-sm shadow-[#27C93F]/50" />

              <span className="ml-2 font-mono text-[11px] text-[#bacac5] flex items-center gap-1.5">
                <span className="text-[#2DD4BF] font-bold">&gt;</span> optima-terminal
              </span>
            </div>

            {/* Terminal Actions */}
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLogs();
                }}
                title="Copy logs"
                className="hover:text-[#2DD4BF] p-1 rounded hover:bg-slate-800/60 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                {copiedLogs && <span className="text-[9px] text-[#2DD4BF] font-bold">Copied!</span>}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedView(!expandedView);
                }}
                title="Toggle view"
                className="hover:text-[#2DD4BF] p-1 rounded hover:bg-slate-800/60 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {expandedView ? "close_fullscreen" : "open_in_full"}
                </span>
              </button>
            </div>
          </div>

          {/* Terminal Content: Staggered Log Output & Numbered Lines */}
          <div className="p-4 font-mono text-xs text-[#2DD4BF] leading-relaxed relative z-10 overflow-hidden">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-1.5"
            >
              <motion.div variants={itemVariants} className="flex items-center gap-3">
                <span className="text-slate-600 select-none text-[10px] w-4 text-right">01</span>
                <span className="text-[#57f1db] font-bold">&gt; Parsing AST...</span>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-3 text-slate-300">
                <span className="text-slate-600 select-none text-[10px] w-4 text-right">02</span>
                <span>&gt; Building CFG...</span>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-3 text-amber-400">
                <span className="text-slate-600 select-none text-[10px] w-4 text-right">03</span>
                <span>&gt; Detecting bottleneck ({resultMetrics?.originalComplexity || "O(n²)"})...</span>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-3 text-slate-300">
                <span className="text-slate-600 select-none text-[10px] w-4 text-right">04</span>
                <span>&gt; Applying optimization...</span>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-3 text-[#2DD4BF]">
                <span className="text-slate-600 select-none text-[10px] w-4 text-right">05</span>
                <span>✓ Complexity Reduced ({resultMetrics?.optimizedComplexity || "O(n)"})</span>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-3 text-[#2DD4BF]">
                <span className="text-slate-600 select-none text-[10px] w-4 text-right">06</span>
                <span>✓ Memory Optimized (+{resultMetrics?.improvementPct || 42}%)</span>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-3 text-emerald-400 font-bold">
                <span className="text-slate-600 select-none text-[10px] w-4 text-right">07</span>
                <span>✓ Build Complete</span>
              </motion.div>

              {/* Line 08: Blinking Cursor Block */}
              <motion.div variants={itemVariants} className="flex items-center gap-3 pt-1">
                <span className="text-slate-600 select-none text-[10px] w-4 text-right">08</span>
                <span className="text-[#2DD4BF] flex items-center gap-1">
                  &gt;
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-2 h-4 bg-[#2DD4BF]"
                  />
                </span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
