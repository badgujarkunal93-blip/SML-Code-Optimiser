"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LanguageInfo } from "./InfoPopup";

interface LanguageNodeProps {
  data: LanguageInfo;
  onClick: (data: LanguageInfo) => void;
  delay?: number;
}

export function LanguageNode({ data, onClick, delay = 0 }: LanguageNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative group cursor-pointer select-none">
      {/* Node Button Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 15 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 170, damping: 20, delay }}
        onClick={() => onClick(data)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative z-20 px-4 py-3 rounded-2xl border transition-all duration-300 ${
          isHovered
            ? "bg-[#0D1425] border-[#35F2D0] shadow-[0_0_30px_rgba(53,242,208,0.25)] -translate-y-1 scale-105"
            : "bg-[#0D1425]/90 border-white/[0.08] shadow-xl hover:border-[#35F2D0]/50"
        } flex items-center gap-3 font-mono text-xs`}
      >
        {/* Status Dot */}
        <span className="w-2 h-2 rounded-full bg-[#35F2D0] animate-pulse shadow-[0_0_8px_#35F2D0]" />

        {/* Icon & Details */}
        <div className="flex items-center gap-2.5">
          <span className="text-base text-[#35F2D0] font-bold">{data.icon}</span>
          <div>
            <div className="font-bold text-white group-hover:text-[#35F2D0] transition-colors">
              {data.name}
            </div>
            <div className="text-[10px] text-[#bacac5] font-sans">{data.compiler}</div>
          </div>
        </div>
      </motion.div>

      {/* Quick Hover Info Floating Card (Appears on Hover) */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-56 p-3 rounded-xl bg-[#0D1425] border border-[#35F2D0]/50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-40 pointer-events-none font-mono text-[11px] space-y-1.5"
        >
          <div className="flex justify-between font-bold text-white border-b border-white/10 pb-1">
            <span>{data.name}</span>
            <span className="text-[#35F2D0]">{data.aiConfidence}% AI</span>
          </div>
          <div className="text-slate-300">⚡ Speed: <span className="text-[#35F2D0] font-bold">{data.typicalSpeed}</span></div>
          <div className="text-slate-300">💾 Memory: <span className="text-[#7BE8FF] font-bold">{data.memoryRating}</span></div>
          <div className="text-[9px] text-[#bacac5] italic pt-0.5">Click node to inspect full architecture</div>
        </motion.div>
      )}
    </div>
  );
}
