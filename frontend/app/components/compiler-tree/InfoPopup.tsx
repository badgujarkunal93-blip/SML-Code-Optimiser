"use client";

import { motion, AnimatePresence } from "framer-motion";

export interface LanguageInfo {
  id: string;
  name: string;
  category: "Runtime" | "Compiler" | "JVM";
  compiler: string;
  executionEngine: string;
  typicalSpeed: string;
  memoryRating: string;
  aiConfidence: number;
  optimizationSupport: string;
  outputFormats: string[];
  benchmarkSupport: string;
  strategy: string;
  ext: string;
  icon: string;
}

interface InfoPopupProps {
  info: LanguageInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InfoPopup({ info, isOpen, onClose }: InfoPopupProps) {
  if (!info) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 font-mono select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="bg-[var(--card)] border border-[var(--primary)]/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden text-[var(--text-primary)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] font-bold text-xl">
                  {info.icon}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                    {info.name} <span className="text-[10px] text-sky-400 uppercase">({info.category})</span>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-mono">Compiler: {info.compiler}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg font-bold p-1 rounded-lg hover:bg-[var(--card-elevated)] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border)] text-center">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Typical Speed</span>
                <span className="text-[var(--primary)] font-bold">{info.typicalSpeed}</span>
              </div>
              <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border)] text-center">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Memory Rating</span>
                <span className="text-sky-400 font-bold">{info.memoryRating}</span>
              </div>
              <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border)] text-center">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">AI Confidence</span>
                <span className="text-[#34D399] font-bold">{info.aiConfidence}%</span>
              </div>
            </div>

            {/* Details List */}
            <div className="space-y-3 text-xs">
              <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Execution Engine:</span>
                <span className="text-[var(--text-primary)]">{info.executionEngine}</span>
              </div>

              <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Optimization Strategy:</span>
                <span className="text-[var(--primary)] font-semibold">{info.strategy}</span>
              </div>

              <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Supported Output Targets:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {info.outputFormats.map((fmt) => (
                    <span key={fmt} className="bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded text-[10px] border border-[var(--primary)]/30 font-bold">
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full bg-[var(--primary)] hover:opacity-90 text-white dark:text-[#07101A] font-mono font-bold text-xs py-2.5 rounded-xl shadow-lg transition-colors"
              >
                Close Architecture Detail
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
