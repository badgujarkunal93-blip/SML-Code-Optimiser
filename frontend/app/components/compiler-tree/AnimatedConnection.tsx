"use client";

import { motion } from "framer-motion";

interface DynamicConnectionProps {
  pX: number;
  pY: number;
  cX: number;
  cY: number;
  isActive?: boolean;
  pulse?: boolean;
  delay?: number;
}

export function AnimatedConnection({
  pX,
  pY,
  cX,
  cY,
  isActive = false,
  pulse = false,
  delay = 0,
}: DynamicConnectionProps) {
  const midY = pY + (cY - pY) * 0.5;
  const pathD = `M ${pX} ${pY} V ${midY} H ${cX} V ${cY}`;

  const strokeColor = isActive ? "rgba(45, 212, 191, 0.95)" : "rgba(45, 212, 191, 0.35)";
  const strokeWidth = isActive ? 2.5 : 2;
  const glowFilter = isActive
    ? "drop-shadow(0 0 14px rgba(45, 212, 191, 0.45))"
    : "drop-shadow(0 0 4px rgba(45, 212, 191, 0.2))";

  return (
    <g style={{ filter: glowFilter }}>
      {/* Background guide line */}
      <path
        d={pathD}
        fill="none"
        stroke="var(--border)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Animated Path */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay, ease: "easeInOut" }}
      />

      {/* Traveling Data Particle */}
      {pulse && (
        <motion.circle
          r="3.5"
          fill="#57f1db"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 7.2,
          }}
        >
          <animateMotion path={pathD} dur="0.8s" repeatCount="indefinite" />
        </motion.circle>
      )}
    </g>
  );
}
