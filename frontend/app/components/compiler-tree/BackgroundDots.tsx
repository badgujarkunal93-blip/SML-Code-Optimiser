"use client";

import { motion } from "framer-motion";

export function BackgroundDots() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
      {/* Soft Radial Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#35F2D0]/10 via-[#7BE8FF]/5 to-transparent blur-3xl rounded-full" />

      {/* Orbiting Tiny Particles */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 border border-[#35F2D0]/20 rounded-full animate-spin-slow pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-[#35F2D0] shadow-[0_0_10px_#35F2D0] absolute -top-1 left-1/2 -translate-x-1/2" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#7BE8FF] shadow-[0_0_8px_#7BE8FF] absolute -bottom-1 left-1/2 -translate-x-1/2" />
      </div>
    </div>
  );
}
