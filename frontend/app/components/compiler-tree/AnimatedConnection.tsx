"use client";

import { motion } from "framer-motion";

interface AnimatedConnectionProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay?: number;
}

export function AnimatedConnection({ startX, startY, endX, endY, delay = 0 }: AnimatedConnectionProps) {
  // Cubic Bezier curve calculation
  const controlY = startY + (endY - startY) * 0.5;
  const pathD = `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
      <defs>
        <linearGradient id={`grad_${startX}_${endX}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#35F2D0" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#7BE8FF" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Background Subtle Line */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth="1.5"
      />

      {/* Animated Glowing Connection Line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={`url(#grad_${startX}_${endX})`}
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay, ease: "easeInOut" }}
      />

      {/* Traveling Glow Pulse Circle */}
      <motion.circle
        r="3"
        fill="#35F2D0"
        filter="drop-shadow(0 0 6px #35F2D0)"
        animate={{
          offsetDistance: ["0%", "100%"],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 1,
          ease: "easeInOut",
          delay: delay + 0.5,
        }}
        style={{
          offsetPath: `path('${pathD}')`,
        }}
      />
    </svg>
  );
}
