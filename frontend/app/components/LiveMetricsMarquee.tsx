"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface MetricData {
  id: string;
  type: "metric" | "announcement";
  label?: string;
  value?: string;
  statusType?: "online" | "ai" | "blockchain" | "compiler";
  announcementText?: string;
  icon?: string;
}

const INITIAL_METRICS: MetricData[] = [
  { id: "m1", type: "metric", label: "Runtime Reduced", value: "91%", statusType: "online", icon: "bolt" },
  { id: "m2", type: "metric", label: "AI Optimizations", value: "1.2M+", statusType: "ai", icon: "psychology" },
  { id: "m3", type: "metric", label: "Languages Supported", value: "12+", statusType: "compiler", icon: "code" },
  { id: "a1", type: "announcement", announcementText: "New Optimization Completed", icon: "auto_awesome" },
  { id: "m4", type: "metric", label: "Avg Speedup", value: "3.8x", statusType: "online", icon: "speed" },
  { id: "m5", type: "metric", label: "Memory Saved", value: "72%", statusType: "online", icon: "memory" },
  { id: "m6", type: "metric", label: "Benchmarks Executed", value: "4.8M+", statusType: "compiler", icon: "analytics" },
  { id: "a2", type: "announcement", announcementText: "AI Reduced Complexity O(n²) → O(n)", icon: "trending_up" },
  { id: "m7", type: "metric", label: "Test Cases Verified", value: "15.4M+", statusType: "online", icon: "task_alt" },
  { id: "m8", type: "metric", label: "Secure Sandboxes", value: "100%", statusType: "online", icon: "shield" },
  { id: "m9", type: "metric", label: "LLVM Optimizations", value: "Enabled", statusType: "compiler", icon: "memory" },
  { id: "a3", type: "announcement", announcementText: "Algorand Transaction Settled", icon: "verified" },
  { id: "m10", type: "metric", label: "Algorand x402", value: "Connected", statusType: "blockchain", icon: "receipt_long" },
  { id: "m11", type: "metric", label: "AI Assistant", value: "Online", statusType: "ai", icon: "smart_toy" },
  { id: "m12", type: "metric", label: "Groq Llama-3.3", value: "Ready", statusType: "ai", icon: "memory" },
  { id: "m13", type: "metric", label: "Piston Runtime", value: "Live", statusType: "online", icon: "terminal" },
];

export function LiveMetricsMarquee() {
  const [metrics, setMetrics] = useState<MetricData[]>(INITIAL_METRICS);

  // Dynamic live metric micro-flips every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((item) => {
          if (item.id === "m1") {
            const nextVal = item.value === "91%" ? "92%" : "91%";
            return { ...item, value: nextVal };
          }
          if (item.id === "m2") {
            const nextVal = item.value === "1.2M+" ? "1.3M+" : "1.2M+";
            return { ...item, value: nextVal };
          }
          if (item.id === "m6") {
            const nextVal = item.value === "4.8M+" ? "4.82M+" : "4.8M+";
            return { ...item, value: nextVal };
          }
          return item;
        })
      );
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (type?: string) => {
    switch (type) {
      case "online":
        return "bg-[#34D399] shadow-[0_0_8px_#34D399]";
      case "ai":
        return "bg-[#2DD4BF] shadow-[0_0_8px_#2DD4BF]";
      case "blockchain":
        return "bg-[#A855F7] shadow-[0_0_8px_#A855F7]";
      case "compiler":
        return "bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]";
      default:
        return "bg-[#2DD4BF]";
    }
  };

  // Duplicate metrics list 3 times for seamless 60 FPS hardware loop
  const triplicatedMetrics = [...metrics, ...metrics, ...metrics];

  return (
    <div className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden my-4 z-30 select-none">
      {/* Container Strip */}
      <div className="w-full h-[52px] sm:h-[60px] md:h-[72px] bg-gradient-to-r from-[#081018] via-[#0D1520] to-[#101827] border-t border-[rgba(45,212,191,0.15)] border-b border-[rgba(45,212,191,0.08)] backdrop-blur-md flex items-center relative group [mask-image:linear-gradient(to_right,transparent_0%,#000_8%,#000_92%,transparent_100%)]">
        
        {/* Scrolling Track */}
        <div className="flex items-center whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] transform-gpu will-change-transform">
          {triplicatedMetrics.map((item, idx) => (
            <React.Fragment key={`${item.id}_${idx}`}>
              {item.type === "announcement" ? (
                /* INJECTED HIGHLIGHT ANNOUNCEMENT PILL CARD */
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 mx-3 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/40 text-[var(--primary)] shadow-[0_0_15px_rgba(45,212,191,0.25)] font-mono text-xs font-bold"
                >
                  <span className="material-symbols-outlined text-sm">{item.icon}</span>
                  <span>{item.announcementText}</span>
                </motion.div>
              ) : (
                /* STANDARD TELEMETRY METRIC ITEM */
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="inline-flex items-center gap-2.5 mx-4 px-3 py-1 rounded-xl transition-colors hover:bg-[var(--card-elevated)] border border-transparent hover:border-[var(--primary)]/30 font-sans text-sm"
                >
                  {/* Pulsing Status Dot */}
                  <span
                    className={`w-2 h-2 rounded-full animate-pulse ${getStatusColor(
                      item.statusType
                    )}`}
                  />

                  {/* Icon & Label */}
                  <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5 text-xs sm:text-sm">
                    {item.icon && (
                      <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">
                        {item.icon}
                      </span>
                    )}
                    {item.label}:
                  </span>

                  {/* Monospace Value */}
                  <span className="font-mono font-bold text-[var(--primary)] text-sm sm:text-base">
                    {item.value}
                  </span>
                </motion.div>
              )}

              {/* Glowing Separator Dot */}
              <span className="text-[var(--primary)]/40 text-xs mx-1 select-none">•</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
