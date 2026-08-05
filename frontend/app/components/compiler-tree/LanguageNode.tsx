"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LanguageInfo } from "./InfoPopup";

interface LanguageNodeProps {
  data: LanguageInfo;
  onClick: (data: LanguageInfo) => void;
  delay?: number;
  isActive?: boolean;
  isDimmed?: boolean;
  onHover?: (id: string | null) => void;
  registerRef?: (id: string, el: HTMLDivElement | null) => void;
}

export function LanguageNode({
  data,
  onClick,
  delay = 0,
  isActive = false,
  isDimmed = false,
  onHover,
  registerRef,
}: LanguageNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(data.id);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(null);
  };

  return (
    <div
      ref={(el) => registerRef?.(data.id, el)}
      className="relative group cursor-pointer select-none"
    >
      {/* Node Button Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 180, damping: 20, delay }}
        onClick={() => onClick(data)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative z-20 px-4 py-3 rounded-xl border transition-all duration-300 ${
          isActive || isHovered
            ? "bg-[var(--card-elevated)] border-[var(--primary)] shadow-[0_0_25px_rgba(45,212,191,0.35)] -translate-y-1 scale-[1.03]"
            : isDimmed
            ? "bg-[var(--card)]/60 border-[var(--border)] opacity-40 grayscale-[40%]"
            : "bg-[var(--card)] border-[var(--border)] shadow-md hover:border-[var(--primary)]/50"
        } flex items-center justify-between font-mono text-xs`}
      >
        <div className="flex items-center gap-3">
          {/* Status Dot */}
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse shadow-sm" />

          {/* Icon & Name */}
          <div className="flex items-center gap-2.5">
            <span className="text-base text-[var(--primary)]">{data.icon}</span>
            <div>
              <div className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                {data.name}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] font-sans">{data.compiler}</div>
            </div>
          </div>
        </div>

        {/* Speed Badge */}
        <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-md border border-[var(--primary)]/20">
          {data.typicalSpeed}
        </span>
      </motion.div>

      {/* Floating Tooltip Card */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 p-3.5 rounded-xl bg-[var(--card-elevated)] border border-[var(--primary)]/40 shadow-2xl z-40 pointer-events-none font-mono text-[11px] space-y-2 backdrop-blur-md"
        >
          <div className="flex justify-between font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-1.5">
            <span className="flex items-center gap-1.5">
              <span>{data.icon}</span>
              <span>{data.name}</span>
            </span>
            <span className="text-[var(--primary)] font-extrabold">{data.aiConfidence}% AI</span>
          </div>

          <div className="space-y-1 text-[var(--text-secondary)] text-[10px]">
            <div>• Runtime Engine: <span className="text-[var(--text-primary)] font-bold">{data.executionEngine}</span></div>
            <div>• Benchmark Gain: <span className="text-[#34D399] font-bold">{data.typicalSpeed}</span></div>
            <div>• Memory RSS: <span className="text-sky-400 font-bold">{data.memoryRating}</span></div>
            <div>• Optimization: <span className="text-[var(--text-primary)]">{data.optimizationSupport}</span></div>
          </div>

          <div className="text-[9px] text-[var(--primary)] font-semibold pt-1 border-t border-[var(--border)] text-center">
            Click node to view full architecture details →
          </div>
        </motion.div>
      )}
    </div>
  );
}
