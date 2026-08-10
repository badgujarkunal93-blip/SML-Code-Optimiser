"use client";

import { motion } from "framer-motion";

interface FlowStep {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

interface PipelineStep {
  name: string;
  desc: string;
  icon: string;
}

const MAIN_USER_FLOW_PART_1: FlowStep[] = [
  {
    id: "1",
    name: "Open Workspace",
    desc: "User opens Optima AI Workspace.",
    icon: "laptop_mac",
  },
  {
    id: "2",
    name: "Write / Paste Code",
    desc: "User enters or pastes source code and selects the programming language.",
    icon: "code",
  },
  {
    id: "3",
    name: "Provide Input (Optional)",
    desc: "User can provide stdin/test input when required.",
    icon: "edit_note",
  },
  {
    id: "4",
    name: "Click Optimize",
    desc: "User starts the optimization process.",
    icon: "ads_click",
  },
  {
    id: "5",
    name: "Request Received",
    desc: "Backend receives the optimization request.",
    icon: "dns",
  },
];

const BACKEND_PIPELINE: PipelineStep[] = [
  {
    name: "Detect Language",
    desc: "Identify the source language and runtime",
    icon: "find_in_page",
  },
  {
    name: "AI Analysis & Optimization",
    desc: "Find bottlenecks and generate an optimized version",
    icon: "psychology",
  },
  {
    name: "Run Original Code",
    desc: "Execute original code securely",
    icon: "terminal",
  },
  {
    name: "Run Optimized Code",
    desc: "Execute the optimized candidate",
    icon: "bolt",
  },
  {
    name: "Benchmark & Compare",
    desc: "Measure runtime and performance differences",
    icon: "analytics",
  },
  {
    name: "Store Results",
    desc: "Save optimization results and history",
    icon: "database",
  },
];

const MAIN_USER_FLOW_PART_2: FlowStep[] = [
  {
    id: "6",
    name: "Results Delivered",
    desc: "Show optimized code and performance metrics.",
    icon: "task_alt",
  },
  {
    id: "7",
    name: "Review & Compare",
    desc: "Compare Original vs Optimized code side-by-side.",
    icon: "compare",
  },
  {
    id: "8",
    name: "Copy / Use Code",
    desc: "Copy the optimized code and use it in the project.",
    icon: "content_copy",
  },
  {
    id: "9",
    name: "View History",
    desc: "Review previous optimization results.",
    icon: "manage_history",
  },
  {
    id: "10",
    name: "Repeat & Improve",
    desc: "Continue optimizing future code.",
    icon: "autorenew",
  },
];

export function WorkflowSection() {
  return (
    <section id="how-it-works" className="space-y-10 py-10 relative">
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto px-4">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)] font-mono text-xs font-bold uppercase tracking-wider"
        >
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
          End-to-End Execution Flow
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight"
        >
          How Optima AI Works
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-sm font-sans text-[var(--text-secondary)] leading-relaxed"
        >
          From your source code to a verified, measurable optimization.
        </motion.p>
      </div>

      {/* Main Container with Handcrafted Infographic Styling */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ============================================================ */}
        {/* ROW 1: MAIN USER FLOW (STEPS 1-5) */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <span className="font-mono text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">
              User Submission Flow
            </span>
            <div className="h-[1px] flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {MAIN_USER_FLOW_PART_1.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="glass-panel p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/40 transition-all hover-scale flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="w-6 h-6 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center font-mono text-[11px] font-extrabold text-[var(--primary)]">
                      {step.id}
                    </span>
                    <span className="material-symbols-outlined text-xl text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
                      {step.icon}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                    {step.name}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug font-sans">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CONNECTING TRANSITION ARROW 1 */}
        <div className="flex justify-center my-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--text-muted)] text-[11px] font-mono shadow-sm"
          >
            <span>Submits Payload</span>
            <span className="material-symbols-outlined text-sm text-[var(--primary)] animate-bounce">
              arrow_downward
            </span>
          </motion.div>
        </div>

        {/* ============================================================ */}
        {/* ROW 2: BACKEND OPTIMIZATION PIPELINE */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-panel-elevated p-5 sm:p-6 rounded-2xl border-2 border-[var(--primary)]/30 relative overflow-hidden bg-[var(--card-elevated)]/80 shadow-xl"
        >
          {/* Subtle Accent Grid Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/5 via-transparent to-[var(--primary)]/5 pointer-events-none" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5 pb-3 border-b border-[var(--border)] relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/15 border border-[var(--primary)]/40 flex items-center justify-center text-[var(--primary)]">
                <span className="material-symbols-outlined text-lg">settings_suggest</span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[var(--text-primary)] font-mono uppercase tracking-wide">
                  Backend Optimization Pipeline
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">
                  Autonomous sandbox execution & AI refactoring engine
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-md border border-[var(--primary)]/20">
              6 Automated Steps
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
            {BACKEND_PIPELINE.map((pStep, idx) => (
              <motion.div
                key={pStep.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="glass-panel p-3.5 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/50 transition-all hover-scale group bg-[var(--card)]"
              >
                <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] mb-2.5 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-base">
                    {pStep.icon}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                  {pStep.name}
                </h4>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1 leading-snug font-sans">
                  &ldquo;{pStep.desc}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CONNECTING TRANSITION ARROW 2 */}
        <div className="flex justify-center my-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--text-muted)] text-[11px] font-mono shadow-sm"
          >
            <span>Generates Verified Output</span>
            <span className="material-symbols-outlined text-sm text-[var(--primary)] animate-bounce">
              arrow_downward
            </span>
          </motion.div>
        </div>

        {/* ============================================================ */}
        {/* ROW 3: RESULT / USER FLOW (STEPS 6-10) */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <span className="font-mono text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">
              Results & Iteration
            </span>
            <div className="h-[1px] flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {MAIN_USER_FLOW_PART_2.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="glass-panel p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/40 transition-all hover-scale flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="w-6 h-6 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center font-mono text-[11px] font-extrabold text-[var(--primary)]">
                      {step.id}
                    </span>
                    <span className="material-symbols-outlined text-xl text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
                      {step.icon}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                    {step.name}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug font-sans">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM OUTCOME STATEMENT */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-panel p-4 sm:p-5 rounded-xl border border-[var(--primary)]/30 text-center flex flex-col sm:flex-row items-center justify-center gap-3 shadow-md bg-[var(--card)]"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/40 flex items-center justify-center text-[var(--primary)] shrink-0">
            <span className="material-symbols-outlined text-lg">check_circle</span>
          </div>
          <p className="font-mono text-xs sm:text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            &ldquo;Faster, cleaner and more efficient code with measurable performance improvement.&rdquo;
          </p>
        </motion.div>
      </div>
    </section>
  );
}
