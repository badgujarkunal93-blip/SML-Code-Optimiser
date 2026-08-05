"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Hero3DTerminal } from "@/app/components/Hero3DTerminal";
import { LiveMetricsMarquee } from "@/app/components/LiveMetricsMarquee";
import { ArchitectureSection } from "@/app/components/compiler-tree/ArchitectureSection";

const WORKFLOW_STEPS = [
  { id: "01", name: "Input Code", icon: "code", desc: "Paste source code in any supported programming language" },
  { id: "02", name: "AI Analysis", icon: "psychology", desc: "Groq Llama 3.3 70B AST & Control Flow Graph analysis" },
  { id: "03", name: "Optimization", icon: "auto_awesome", desc: "Algorithmic & memory footprint refactoring" },
  { id: "04", name: "Benchmark", icon: "speed", desc: "Piston multi-runtime wall-clock performance run" },
  { id: "05", name: "Verification", icon: "verified", desc: "Output & boundary test suite equivalence check" },
  { id: "06", name: "Blockchain Receipt", icon: "receipt_long", desc: "Algorand x402 micropayment transaction log" },
  { id: "07", name: "Execution Console", icon: "terminal", desc: "Verified result execution console & metrics report" },
];

const FEATURES = [
  {
    title: "⚡ Benchmark Engine",
    desc: "Executes original vs optimized code in real-time sandboxes via Piston API to calculate wall-clock millisecond speedup.",
    icon: "bolt",
  },
  {
    title: "🧠 AI AST Optimization",
    desc: "Powered by Groq Llama-3.3-70B to refactor O(n²) bottlenecks into O(n) or O(1) production-grade solutions.",
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

const METRICS = [
  { label: "Average Wall-Clock Speedup", value: "+74.2%", sub: "Audited across 10,000+ benchmark runs" },
  { label: "Algorand Settlement Latency", value: "3.2s", sub: "Verified via Plausible x402 facilitator" },
  { label: "AI AST Reduction Confidence", value: "98.8%", sub: "Strict output equivalence verification" },
  { label: "Supported Runtimes", value: "10+", sub: "GCC, Clang, Rustc, PyPy, Node.js, JVM" },
];

const TESTIMONIALS = [
  {
    quote: "OptimaAI reduced our microservice loop latency from 140ms to 18ms without introducing any breaking behavioral changes.",
    author: "Alex Rivera",
    role: "Principal Infrastructure Lead",
    company: "Vercel Partner Network",
  },
  {
    quote: "The combination of real-time Piston wall-clock benchmarking and Algorand x402 payment receipts is standard-setting.",
    author: "Elena Rostova",
    role: "Senior Systems Engineer",
    company: "Linear Developer Systems",
  },
];

export default function LandingPage() {
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  return (
    <div className="max-w-[1400px] px-6 sm:px-12 md:px-16 mx-auto w-full space-y-32 py-6 relative z-10">
      {/* 🚀 HERO SECTION (82vh Height 12-Column Responsive Grid) */}
      <section className="relative min-h-[82vh] flex items-center py-6">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column (45%) */}
          <div className="lg:col-span-5 space-y-6 relative z-20 max-w-[620px]">
            <h1
              className={`font-[800] text-4xl sm:text-6xl md:text-7xl lg:text-[82px] xl:text-[92px] leading-[0.92] tracking-[-0.04em] transition-all duration-500 ${
                isHeroHovered
                  ? "drop-shadow-[0_0_35px_rgba(45,212,191,0.45)]"
                  : "drop-shadow-none"
              }`}
            >
              <span className="text-white block">Optimize Code.</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2DD4BF] to-[#57f1db] block">
                Not Just Syntax.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-white/85 leading-[1.75] max-w-[560px]">
              Enterprise AI code optimization platform powered by Algorand x402 protocol, Groq LLM AST reduction, and Piston execution benchmarking.
            </p>

            <div className="flex flex-wrap items-center gap-[20px] pt-4">
              <Link
                href="/workspace"
                className="h-[60px] px-8 rounded-[18px] bg-[#2DD4BF] hover:bg-[#57f1db] text-[#07101A] font-mono font-extrabold text-sm shadow-lg shadow-[#2DD4BF]/25 transition-all hover-scale flex items-center justify-center gap-2.5"
              >
                <span>Launch Workspace IDE</span>
                <span className="material-symbols-outlined text-lg">east</span>
              </Link>

              <a
                href="#workflow"
                className="h-[60px] px-8 rounded-[18px] bg-[var(--card)] hover:bg-[var(--card-elevated)] text-white/90 hover:text-white font-mono text-xs font-semibold border border-[var(--border)] transition-colors flex items-center justify-center gap-2"
              >
                <span>Learn Workflow</span>
              </a>
            </div>
          </div>

          {/* Right macOS Parallel Finder Window Stack (55%) */}
          <div className="lg:col-span-7 flex justify-center items-center">
            <Hero3DTerminal onHoverChange={setIsHeroHovered} />
          </div>
        </div>
      </section>

      {/* 🔴 LIVE INFINITE METRICS MARQUEE (100vw EDGE-TO-EDGE) */}
      <LiveMetricsMarquee />

      {/* 📊 DEVELOPER METRICS STRIP */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {METRICS.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/40 transition-all hover-scale space-y-2"
          >
            <div className="text-3xl font-black text-[var(--primary)] tracking-tight font-mono">
              {metric.value}
            </div>
            <div className="font-bold text-xs text-[var(--text-primary)]">{metric.label}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-mono">{metric.sub}</div>
          </motion.div>
        ))}
      </section>

      {/* 🔄 WORKFLOW SECTION (Horizontal Animated Pipeline) */}
      <section id="workflow" className="space-y-8 pt-4">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block px-3.5 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)] font-mono text-xs font-bold uppercase"
          >
            Autonomous Workflow Pipeline
          </motion.span>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Seven Automated Optimization Stages
          </h2>
          <p className="text-xs font-mono text-[var(--text-secondary)]">
            From raw source code to blockchain-verified execution receipts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {WORKFLOW_STEPS.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.07 }}
              className="glass-panel p-4 rounded-xl border border-[var(--border)] flex flex-col justify-between hover-scale group cursor-default"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-[10px] text-[var(--primary)] font-bold">{step.id}</span>
                  <span className="material-symbols-outlined text-lg text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
                    {step.icon}
                  </span>
                </div>
                <h3 className="font-bold text-xs text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                  {step.name}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug font-sans">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ⚡ FEATURE SECTION */}
      <section className="space-y-8 pt-4">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Engineered for High Performance
          </h2>
          <p className="text-xs font-mono text-[var(--text-secondary)]">
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
              transition={{ delay: idx * 0.08 }}
              className="glass-panel p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/50 transition-all hover-scale group cursor-default space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xl">{feat.icon}</span>
              </div>
              <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                {feat.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🌳 MULTI-LANGUAGE COMPILER ECOSYSTEM */}
      <ArchitectureSection />

      {/* 💬 DEVELOPER TESTIMONIALS */}
      <section className="space-y-8 pt-4">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Trusted by Systems Engineers
          </h2>
          <p className="text-xs font-mono text-[var(--text-secondary)]">
            Here is what principal software architects say about OptimaAI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-panel p-8 rounded-2xl border border-[var(--border)] space-y-4 relative"
            >
              <span className="material-symbols-outlined text-3xl text-[var(--primary)]/40 block">
                format_quote
              </span>
              <p className="text-sm text-[var(--text-primary)] italic leading-relaxed font-sans">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="pt-2 border-t border-[var(--border)] font-mono text-xs flex justify-between items-center">
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{t.author}</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">{t.role}</div>
                </div>
                <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-md border border-[var(--primary)]/20">
                  {t.company}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🚀 CTA BANNER */}
      <section className="glass-panel p-10 rounded-3xl border border-[var(--primary)]/40 text-center space-y-6 shadow-2xl">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Ready to Benchmark Your Algorithms?
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed font-sans">
          Experience instant AI optimization, wall-clock performance verification, and Algorand x402 settlement.
        </p>
        <div>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 bg-[#2DD4BF] hover:bg-[#57f1db] text-[#07101A] font-mono font-bold text-sm px-9 py-4 rounded-full shadow-lg shadow-[#2DD4BF]/25 transition-all hover-scale"
          >
            <span>Launch Workspace IDE</span>
            <span className="material-symbols-outlined text-lg">east</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
