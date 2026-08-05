"use client";

import React from "react";
import { motion } from "framer-motion";

interface TreeBranchProps {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color?: string;
  delay?: number;
  isActive?: boolean;
  isDimmed?: boolean;
  onHover?: (id: string | null) => void;
  registerRef?: (id: string, el: HTMLDivElement | null) => void;
}

export function TreeBranch({
  id,
  title,
  subtitle,
  icon,
  delay = 0,
  isActive = false,
  isDimmed = false,
  onHover,
  registerRef,
}: TreeBranchProps) {
  return (
    <motion.div
      ref={(el) => registerRef?.(id, el)}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 180, damping: 20, delay }}
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
      className={`relative z-20 px-6 py-3.5 rounded-2xl bg-[var(--card-elevated)] border cursor-pointer flex items-center gap-3 font-mono text-xs select-none transition-all duration-300 transform-gpu ${
        isActive
          ? "border-[var(--primary)] shadow-[0_0_30px_rgba(45,212,191,0.4)] scale-105"
          : isDimmed
          ? "border-[var(--border)] opacity-40 grayscale-[40%]"
          : "border-[var(--primary)]/30 hover:border-[var(--primary)]/70 shadow-md"
      }`}
    >
      <span
        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-colors ${
          isActive
            ? "bg-[var(--primary)] text-[#07101A] shadow"
            : "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30"
        }`}
      >
        <span className="material-symbols-outlined text-sm">{icon}</span>
      </span>
      <div>
        <div className="font-bold text-[var(--text-primary)] tracking-tight text-xs">{title}</div>
        <div className="text-[10px] text-[var(--text-secondary)] font-sans">{subtitle}</div>
      </div>
    </motion.div>
  );
}
