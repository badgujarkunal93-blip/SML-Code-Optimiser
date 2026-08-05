"use client";

import { motion } from "framer-motion";

interface TreeBranchProps {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  delay?: number;
}

export function TreeBranch({ title, subtitle, icon, color, delay = 0 }: TreeBranchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 170, damping: 20, delay }}
      className="relative z-20 px-5 py-3 rounded-2xl bg-[#0D1425] border border-[#35F2D0]/30 shadow-[0_0_20px_rgba(53,242,208,0.1)] flex items-center gap-3 font-mono text-xs select-none"
    >
      <span className="w-8 h-8 rounded-xl bg-[#35F2D0]/10 border border-[#35F2D0]/30 flex items-center justify-center text-[#35F2D0] font-bold">
        {icon}
      </span>
      <div>
        <div className="font-bold text-white tracking-tight">{title}</div>
        <div className="text-[10px] text-[#bacac5] font-sans">{subtitle}</div>
      </div>
    </motion.div>
  );
}
