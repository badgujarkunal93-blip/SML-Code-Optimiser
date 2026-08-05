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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 170, damping: 20 }}
            className="bg-[#0D1425] border border-[#35F2D0]/40 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(53,242,208,0.15)] space-y-6 relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#35F2D0]/10 border border-[#35F2D0]/30 flex items-center justify-center text-[#35F2D0] font-bold text-lg">
                  {info.icon}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {info.name} <span className="text-[10px] text-[#7BE8FF] uppercase">({info.category})</span>
                  </h3>
                  <p className="text-xs text-[#bacac5] font-mono">Engine: {info.compiler}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-[#050816] p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-[#bacac5] uppercase block mb-1">Typical Speed</span>
                <span className="text-[#35F2D0] font-bold">{info.typicalSpeed}</span>
              </div>
              <div className="bg-[#050816] p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-[#bacac5] uppercase block mb-1">Memory Rating</span>
                <span className="text-[#7BE8FF] font-bold">{info.memoryRating}</span>
              </div>
              <div className="bg-[#050816] p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-[#bacac5] uppercase block mb-1">AI Confidence</span>
                <span className="text-emerald-400 font-bold">{info.aiConfidence}%</span>
              </div>
            </div>

            {/* Details List */}
            <div className="space-y-3 text-xs">
              <div className="bg-[#050816] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-[#bacac5] uppercase font-bold block">Execution Engine:</span>
                <span className="text-slate-200">{info.executionEngine}</span>
              </div>

              <div className="bg-[#050816] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-[#bacac5] uppercase font-bold block">Optimization Strategy:</span>
                <span className="text-[#35F2D0]">{info.strategy}</span>
              </div>

              <div className="bg-[#050816] p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-[#bacac5] uppercase font-bold block">Supported Output Targets:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {info.outputFormats.map((fmt) => (
                    <span key={fmt} className="bg-[#35F2D0]/10 text-[#35F2D0] px-2 py-0.5 rounded text-[10px] border border-[#35F2D0]/30 font-bold">
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
                className="w-full bg-[#35F2D0] hover:bg-[#7BE8FF] text-[#050816] font-mono font-bold text-xs py-2.5 rounded-xl shadow-lg transition-colors"
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
