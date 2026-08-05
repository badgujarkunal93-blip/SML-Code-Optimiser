"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Hero3DTerminal } from "@/app/components/Hero3DTerminal";
import { ArchitectureSection } from "@/app/components/compiler-tree/ArchitectureSection";

const WORKFLOW_STEPS = [
  { id: "01", name: "Input Code", icon: "code", desc: "Paste source code in any language" },
  { id: "02", name: "AI Analysis", icon: "psychology", desc: "Groq LLM AST & CFG analysis" },
  { id: "03", name: "Optimization", icon: "auto_awesome", desc: "Algorithmic & memory refactoring" },
  { id: "04", name: "Benchmark", icon: "speed", desc: "Piston wall-clock performance run" },
  { id: "05", name: "Verification", icon: "verified", desc: "Output & test case equivalence check" },
  { id: "06", name: "Blockchain Receipt", icon: "receipt_long", desc: "Algorand x402 transaction log" },
  { id: "07", name: "Execution", icon: "terminal", desc: "Verified result execution console" },
];

const FEATURES = [
  {
    title: "⚡ Benchmark Engine",
    desc: "Executes original vs optimized code in real-time sandbox via Piston API to calculate wall-clock millisecond speedup.",
    icon: "bolt",
  },
  {
    title: "🧠 AI Optimization",
    desc: "Powered by Groq llama-3.3-70b to refactor O(n²) bottlenecks into O(n) or O(1) production-grade solutions.",
    icon: "smart_toy",
  },
  {
    title: "🔄 Language Conversion",
    desc: "Seamlessly cross-compile and refactor Python to Rust, JavaScript to Go, or C++ to TypeScript.",
    icon: "translate",
  },
  {
    title: "🧪 Execution Sandbox",
    desc: "Isolated multi-runtime environment with custom stdin support and AI-generated boundary test suites.",
    icon: "terminal",
  },
  {
    title: "🔒 Algorand x402 Settlement",
    desc: "Decentralized micro-payment challenge & response protocol verified over Algorand testnet via Plausible facilitator.",
    icon: "token",
  },
  {
    title: "📊 History & Analytics",
    desc: "Cloud Firestore persistence logging execution benchmarks, memory drops, and transaction hashes.",
    icon: "bar_chart",
  },
];

const ARCH_NODES = [
  { id: "front", name: "Next.js Frontend", icon: "desktop_windows", sub: "React 19 / Monaco" },
  { id: "ai", name: "AI Engine", icon: "psychology", sub: "Groq Llama 3.3 70B" },
  { id: "opt", name: "Optimization Engine", icon: "auto_awesome", sub: "AST & CFG Reducer" },
  { id: "piston", name: "Execution Engine", icon: "terminal", sub: "Piston Multi-runtime" },
  { id: "x402", name: "Algorand x402", icon: "token", sub: "USDC Micropayments" },
  { id: "db", name: "Firestore DB", icon: "database", sub: "Cloud Audit History" },
];

export default function LandingPage() {
  const [isTerminalHovered, setIsTerminalHovered] = useState(false);

  return (
    <div className="space-y-24 py-6 relative z-10 w-full">
      {/* 🚀 HERO SECTION (Fixed Heading Bug Fix & Isolated Terminal Animation) */}
      <section className="relative min-h-[560px] flex items-center py-8">
        <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Header: ABSOLUTELY FIXED POSITIONING (Never moves or translates on terminal hover) */}
          <div className="lg:col-span-5 space-y-6 relative z-20">
            <h1
              className={`font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#dde4e1] leading-tight tracking-tight transition-all duration-500 ${
                isTerminalHovered ? "drop-shadow-[0_0_25px_rgba(45,212,191,0.4)]" : "drop-shadow-none"
              }`}
            >
              Optimize Code. <br />
              <span className="text-[#2DD4BF] font-black">Not Just Syntax.</span>
            </h1>

            <p className="text-base text-[#bacac5] leading-relaxed max-w-lg">
              AI-powered code optimization, wall-clock performance benchmarking, cross-language compilation, and blockchain-backed execution receipts.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/workspace"
                className="bg-[#2DD4BF] hover:bg-[#57f1db] text-[#020617] font-mono font-bold text-sm px-8 py-3.5 rounded-full shadow-lg shadow-[#2DD4BF]/25 transition-all hover-scale flex items-center gap-2"
              >
                <span>Optimize Now</span>
                <span className="material-symbols-outlined text-lg">east</span>
              </Link>

              <a
                href="#workflow"
                className="bg-[#0F172A] hover:bg-slate-800 text-[#bacac5] hover:text-white font-mono text-xs font-semibold px-6 py-3.5 rounded-full border border-[#3c4a46]/40 transition-colors"
              >
                Learn Workflow
              </a>
            </div>
          </div>

          {/* Right 3D Floating Terminal Hero Component */}
          <div className="lg:col-span-7">
            <Hero3DTerminal onHoverChange={setIsTerminalHovered} />
          </div>
        </div>
      </section>

      {/* 🔄 WORKFLOW SECTION (Horizontal Animated Pipeline) */}
      <section id="workflow" className="space-y-8 pt-6">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span className="text-[#2DD4BF]">⚡</span> Autonomous Optimization Pipeline
          </h2>
          <p className="text-xs font-mono text-[#bacac5]">
            Seven automated stages from raw source code to blockchain-verified execution receipts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {WORKFLOW_STEPS.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="glass-panel p-4 rounded-xl border border-[#3c4a46]/30 flex flex-col justify-between hover-scale group cursor-default"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-[10px] text-[#2DD4BF] font-bold">{step.id}</span>
                  <span className="material-symbols-outlined text-lg text-slate-400 group-hover:text-[#2DD4BF] transition-colors">
                    {step.icon}
                  </span>
                </div>
                <h3 className="font-bold text-xs text-white group-hover:text-[#2DD4BF] transition-colors">
                  {step.name}
                </h3>
                <p className="text-[11px] text-[#bacac5] mt-1 leading-snug font-sans">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ⚡ FEATURE SECTION */}
      <section className="space-y-8 pt-6">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Engineered for High Performance
          </h2>
          <p className="text-xs font-mono text-[#bacac5]">
            Enterprise infrastructure built for developers, competitive programmers, and algorithmic auditors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, idx) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-panel p-6 rounded-2xl border border-[#3c4a46]/30 hover:border-[#2DD4BF]/50 transition-all hover-scale group cursor-default space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 flex items-center justify-center text-[#2DD4BF] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xl">{feat.icon}</span>
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-[#2DD4BF] transition-colors">
                {feat.title}
              </h3>
              <p className="text-xs text-[#bacac5] leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🌳 MULTI-LANGUAGE COMPILER SUPPORT (Interactive Architecture Tree Highlight) */}
      <ArchitectureSection />

      {/* 🏗️ INTERACTIVE ARCHITECTURE SECTION */}
      <section className="space-y-8 pt-6">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System Architecture
          </h2>
          <p className="text-xs font-mono text-[#bacac5]">
            End-to-end dataflow across client, AI inference engines, execution sandboxes, and Algorand smart contracts.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-[#3c4a46]/30 shadow-2xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 font-mono text-xs">
            {ARCH_NODES.map((node, idx) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#020617] p-4 rounded-xl border border-[#2DD4BF]/30 text-center space-y-2 relative group hover:border-[#2DD4BF] transition-colors"
              >
                <span className="material-symbols-outlined text-2xl text-[#2DD4BF] group-hover:scale-110 transition-transform block">
                  {node.icon}
                </span>
                <div className="font-bold text-white text-xs">{node.name}</div>
                <div className="text-[10px] text-[#bacac5]">{node.sub}</div>

                {idx < ARCH_NODES.length - 1 && (
                  <span className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-[#2DD4BF] font-bold text-sm z-20">
                    →
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 CTA BANNER */}
      <section className="glass-panel p-10 rounded-3xl border border-[#2DD4BF]/40 text-center space-y-6 shadow-2xl">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Ready to Benchmark Your Algorithms?
        </h2>
        <p className="text-sm text-[#bacac5] max-w-xl mx-auto leading-relaxed font-sans">
          Experience instant AI optimization, wall-clock performance verification, and Algorand x402 settlement.
        </p>
        <div>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 bg-[#2DD4BF] hover:bg-[#57f1db] text-[#020617] font-mono font-bold text-sm px-9 py-4 rounded-full shadow-lg shadow-[#2DD4BF]/25 transition-all hover-scale"
          >
            <span>Launch Workspace IDE</span>
            <span className="material-symbols-outlined text-lg">east</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
