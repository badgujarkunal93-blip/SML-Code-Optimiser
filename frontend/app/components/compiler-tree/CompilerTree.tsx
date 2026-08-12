"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { LanguageNode } from "./LanguageNode";
import { TreeBranch } from "./TreeBranch";
import { AnimatedConnection } from "./AnimatedConnection";
import { InfoPopup, LanguageInfo } from "./InfoPopup";

const LANGUAGE_DATA: LanguageInfo[] = [
  // Smart Contracts & AVM Engine
  {
    id: "teal",
    name: "TEAL",
    category: "Smart Contract",
    compiler: "Algorand AVM 10",
    executionEngine: "AVM Bytecode Sandbox",
    typicalSpeed: "+74.2% opcode gain",
    memoryRating: "AVM Stack",
    aiConfidence: 99,
    optimizationSupport: "Redundant opcode pruning & stack depth optimization",
    outputFormats: ["TEAL Assembly", "AVM Bytecode"],
    benchmarkSupport: "AVM Execution & Algorand x402 Settlement",
    strategy: "Prune redundant stack pushes/pops, inline constant bytes, and optimize conditional branching opcodes.",
    ext: "teal",
    icon: "⚙️",
  },
  {
    id: "pyteal",
    name: "PyTeal",
    category: "Smart Contract",
    compiler: "PyTeal -> TEAL Compiler",
    executionEngine: "PyTeal AST & AVM Sandbox",
    typicalSpeed: "+68% gas reduction",
    memoryRating: "AVM State",
    aiConfidence: 98,
    optimizationSupport: "PyTeal Expression AST simplification",
    outputFormats: ["Compiled TEAL", "PyTeal Expression Graph"],
    benchmarkSupport: "Algorand x402 Micropayment Verified",
    strategy: "Simplify PyTeal Seq([]) blocks and eliminate dead conditional branches before compiling to TEAL assembly.",
    ext: "py",
    icon: "🅰️",
  },
  // Runtime Engine
  {
    id: "python",
    name: "Python",
    category: "Runtime",
    compiler: "PyPy 3.10 / CPython",
    executionEngine: "Piston PyPy3 Sandbox Engine",
    typicalSpeed: "+85% wall-clock gain",
    memoryRating: "14MB RSS",
    aiConfidence: 99,
    optimizationSupport: "O(n²) → O(n) algorithmic reduction & vectorization",
    outputFormats: ["Executable Python", "PyPy JIT Bytecode"],
    benchmarkSupport: "Full Wall-Clock & Memory Audit",
    strategy: "Replace nested loop filtering with single-pass list comprehensions and C-implemented builtins.",
    ext: "py",
    icon: "🐍",
  },
  {
    id: "javascript",
    name: "JavaScript",
    category: "Runtime",
    compiler: "V8 Engine v12",
    executionEngine: "Node.js v20.11 LTS",
    typicalSpeed: "+64% speedup",
    memoryRating: "18MB RSS",
    aiConfidence: 98,
    optimizationSupport: "Array chaining refactoring to single-pass loops",
    outputFormats: ["ESNext ES6 Module"],
    benchmarkSupport: "V8 Profiler & Piston Exec",
    strategy: "Eliminate intermediate allocations from .filter().map() chains into direct for...of iterations.",
    ext: "js",
    icon: "⚡",
  },
  {
    id: "nodejs",
    name: "Node.js",
    category: "Runtime",
    compiler: "V8 / libuv",
    executionEngine: "Node.js Event Loop Engine",
    typicalSpeed: "+58% throughput",
    memoryRating: "22MB RSS",
    aiConfidence: 96,
    optimizationSupport: "Asynchronous stream pipeline optimization",
    outputFormats: ["CommonJS / ESM"],
    benchmarkSupport: "Event Loop Microbench",
    strategy: "Non-blocking async stream iteration and buffer allocations.",
    ext: "cjs",
    icon: "🟢",
  },
  {
    id: "typescript",
    name: "TypeScript",
    category: "Runtime",
    compiler: "tsc 5.4 / V8",
    executionEngine: "Node.js TS-Node Execution",
    typicalSpeed: "+72% speedup",
    memoryRating: "16MB RSS",
    aiConfidence: 98,
    optimizationSupport: "Strict type narrowing & zero-allocation generics",
    outputFormats: ["Clean TypeScript", "ESNext JS"],
    benchmarkSupport: "Full Type Audit & Exec",
    strategy: "Optimize object shape stability for V8 inline caches and remove unnecessary object cloning.",
    ext: "ts",
    icon: "🔷",
  },

  // Compiler Engine
  {
    id: "rust",
    name: "Rust",
    category: "Compiler",
    compiler: "rustc 1.76 / LLVM 17",
    executionEngine: "Native Cargo Release binary",
    typicalSpeed: "+94% peak speed",
    memoryRating: "2MB RSS",
    aiConfidence: 97,
    optimizationSupport: "Zero-cost abstractions & SIMD vectorization",
    outputFormats: ["Native Binary", "Wasm"],
    benchmarkSupport: "Criterion.rs & Piston Exec",
    strategy: "Inlining iterators and replacing heap allocation vectors with stack-allocated arrays.",
    ext: "rs",
    icon: "🦀",
  },
  {
    id: "go",
    name: "Go",
    category: "Compiler",
    compiler: "gc 1.22 Toolchain",
    executionEngine: "Native Go Runtime Binary",
    typicalSpeed: "+82% speedup",
    memoryRating: "4MB RSS",
    aiConfidence: 96,
    optimizationSupport: "Goroutine channel pooling & escape analysis",
    outputFormats: ["Native Go Executable"],
    benchmarkSupport: "Go Benchmark Suite",
    strategy: "Reduce heap escapes to keep pointer allocation on stack frames.",
    ext: "go",
    icon: "🐹",
  },
  {
    id: "cpp",
    name: "C++",
    category: "Compiler",
    compiler: "GCC 13.2 / Clang 17",
    executionEngine: "Native ELF x86_64 Executable",
    typicalSpeed: "+96% peak speed",
    memoryRating: "1.5MB RSS",
    aiConfidence: 99,
    optimizationSupport: "Auto-vectorization & O3 Fast-Math flags",
    outputFormats: ["C++20 Binary"],
    benchmarkSupport: "Google Benchmark & Exec",
    strategy: "Replace std::vector dynamic reallocations with std::array and reserve capacity.",
    ext: "cpp",
    icon: "⚙️",
  },

  // JVM System
  {
    id: "java",
    name: "Java",
    category: "JVM",
    compiler: "OpenJDK 21 / HotSpot JIT",
    executionEngine: "GraalVM / HotSpot JIT Runtime",
    typicalSpeed: "+76% throughput",
    memoryRating: "32MB RSS",
    aiConfidence: 98,
    optimizationSupport: "Escape analysis & C2 JIT loop unrolling",
    outputFormats: ["JVM Bytecode Jar"],
    benchmarkSupport: "JMH Benchmark Suite",
    strategy: "Use primitive specialization collections (IntList) over boxed Integer wrappers.",
    ext: "java",
    icon: "☕",
  },
  {
    id: "kotlin",
    name: "Kotlin",
    category: "JVM",
    compiler: "kotlinc 1.9.20",
    executionEngine: "JVM / Native K/N Runtime",
    typicalSpeed: "+70% speedup",
    memoryRating: "28MB RSS",
    aiConfidence: 97,
    optimizationSupport: "Inline functions & coroutine allocation reduction",
    outputFormats: ["JVM Class Bytecode"],
    benchmarkSupport: "KotlinX Benchmark",
    strategy: "Inline lambdas to prevent function object instantiation in critical loops.",
    ext: "kt",
    icon: "🎯",
  },
];

interface ConnectionData {
  parentId: string;
  childId: string;
  pX: number;
  pY: number;
  cX: number;
  cY: number;
}

export function CompilerTree() {
  const [selectedLang, setSelectedLang] = useState<LanguageInfo | null>(null);
  const [activeHoverNode, setActiveHoverNode] = useState<string | null>(null);
  const [pulseActive, setPulseActive] = useState<boolean>(true);
  const [connections, setConnections] = useState<ConnectionData[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Mobile accordion state
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({
    Runtime: true,
    Compiler: false,
    JVM: false,
  });

  const runtimeLangs = LANGUAGE_DATA.filter((l) => l.category === "Runtime");
  const compilerLangs = LANGUAGE_DATA.filter((l) => l.category === "Compiler");
  const jvmLangs = LANGUAGE_DATA.filter((l) => l.category === "JVM");

  const registerNodeRef = useCallback((id: string, el: HTMLDivElement | null) => {
    nodeRefs.current[id] = el;
  }, []);

const TREE_TOPOLOGY: Array<{ parent: string; children: string[] }> = [
  { parent: "root_node", children: ["ast_node"] },
  { parent: "ast_node", children: ["engine_runtime", "engine_compiler", "engine_jvm"] },
  { parent: "engine_runtime", children: ["python", "javascript", "nodejs", "typescript"] },
  { parent: "engine_compiler", children: ["rust", "go", "cpp"] },
  { parent: "engine_jvm", children: ["java", "kotlin"] },
];

  // Recalculate dynamic node coordinates (Parent bottom-center -> Child top-center)
  const updateConnections = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const newConns: ConnectionData[] = [];

    TREE_TOPOLOGY.forEach(({ parent, children }) => {
      const parentEl = nodeRefs.current[parent];
      if (!parentEl) return;
      const pRect = parentEl.getBoundingClientRect();
      const pX = pRect.left + pRect.width / 2 - containerRect.left;
      const pY = pRect.bottom - containerRect.top;

      children.forEach((childId) => {
        const childEl = nodeRefs.current[childId];
        if (!childEl) return;
        const cRect = childEl.getBoundingClientRect();
        const cX = cRect.left + cRect.width / 2 - containerRect.left;
        const cY = cRect.top - containerRect.top;

        newConns.push({ parentId: parent, childId, pX, pY, cX, cY });
      });
    });

    setConnections(newConns);
  }, []);

  useEffect(() => {
    updateConnections();
    const handleResize = () => updateConnections();
    window.addEventListener("resize", handleResize);

    const observer = new ResizeObserver(() => updateConnections());
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [updateConnections]);

  // 8-second repeating pulse cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseActive(false);
      setTimeout(() => setPulseActive(true), 50);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Bidirectional Path Highlighting logic
  const isNodeActive = (id: string): boolean => {
    if (!activeHoverNode) return false;
    if (activeHoverNode === id) return true;

    // Parent Engine hovered -> highlight all children
    if (activeHoverNode === "engine_runtime" && ["python", "javascript", "nodejs", "typescript"].includes(id)) return true;
    if (activeHoverNode === "engine_compiler" && ["rust", "go", "cpp"].includes(id)) return true;
    if (activeHoverNode === "engine_jvm" && ["java", "kotlin"].includes(id)) return true;

    // Child Language hovered -> highlight parent engine & root
    if (["python", "javascript", "nodejs", "typescript"].includes(activeHoverNode) && (id === "engine_runtime" || id === "ast_node" || id === "root_node")) return true;
    if (["rust", "go", "cpp"].includes(activeHoverNode) && (id === "engine_compiler" || id === "ast_node" || id === "root_node")) return true;
    if (["java", "kotlin"].includes(activeHoverNode) && (id === "engine_jvm" || id === "ast_node" || id === "root_node")) return true;

    if (["engine_runtime", "engine_compiler", "engine_jvm"].includes(activeHoverNode) && (id === "ast_node" || id === "root_node")) return true;

    return false;
  };

  const isNodeDimmed = (id: string): boolean => {
    if (!activeHoverNode) return false;
    return !isNodeActive(id);
  };

  const isConnectionActive = (conn: ConnectionData): boolean => {
    if (!activeHoverNode) return false;
    return (
      (isNodeActive(conn.parentId) && isNodeActive(conn.childId)) ||
      conn.parentId === activeHoverNode ||
      conn.childId === activeHoverNode
    );
  };

  return (
    <div className="relative w-full max-w-[1600px] mx-auto py-12 px-4 font-mono select-none overflow-visible">
      {/* Radial Glow Centered Behind Root */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#2DD4BF]/20 via-sky-500/10 to-transparent blur-3xl pointer-events-none rounded-full z-0" />

      {/* MASTER TREE CONTAINER */}
      <div ref={containerRef} className="relative z-20 w-full min-h-[720px] hidden md:block">
        
        {/* MASTER UNIFIED SVG CANVAS OVERLAY */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
          {connections.map((conn, idx) => (
            <AnimatedConnection
              key={`${conn.parentId}_${conn.childId}_${idx}`}
              pX={conn.pX}
              pY={conn.pY}
              cX={conn.cX}
              cY={conn.cY}
              isActive={isConnectionActive(conn)}
              pulse={pulseActive}
              delay={0.1 + idx * 0.04}
            />
          ))}
        </svg>

        {/* LEVEL 1: ROOT NODE (AI OPTIMIZATION PLATFORM) */}
        <div className="flex justify-center mb-[100px]">
          <div ref={(el) => registerNodeRef("root_node", el)} className="inline-block">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{
                boxShadow: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                scale: { type: "spring", stiffness: 180, damping: 20 },
              }}
              onMouseEnter={() => setActiveHoverNode("root_node")}
              onMouseLeave={() => setActiveHoverNode(null)}
              animate={{
                boxShadow: [
                  "0 0 25px rgba(45,212,191,0.25)",
                  "0 0 45px rgba(45,212,191,0.50)",
                  "0 0 25px rgba(45,212,191,0.25)",
                ],
              }}
              className={`px-8 py-4.5 rounded-2xl bg-[var(--card)] border-2 cursor-pointer flex items-center gap-3 font-extrabold text-sm transition-all duration-300 transform-gpu ${
                isNodeActive("root_node")
                  ? "border-[var(--primary)] text-[var(--primary)] scale-105"
                  : "border-[var(--primary)] text-[var(--primary)] hover:border-[var(--primary)]"
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-[var(--primary)] animate-ping" />
              <span>⚡ AI Optimization Platform</span>
            </motion.div>
          </div>
        </div>

        {/* LEVEL 2: AST PARSER NODE */}
        <div className="flex justify-center mb-[130px]">
          <div ref={(el) => registerNodeRef("ast_node", el)} className="inline-block">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              onMouseEnter={() => setActiveHoverNode("ast_node")}
              onMouseLeave={() => setActiveHoverNode(null)}
              className={`px-6 py-3 rounded-xl bg-[var(--card-elevated)] border text-xs cursor-pointer flex items-center gap-2 transition-all duration-300 ${
                isNodeActive("ast_node")
                  ? "border-[var(--primary)] text-[var(--text-primary)] shadow-[0_0_25px_rgba(45,212,191,0.35)] scale-105"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50"
              }`}
            >
              <span className="material-symbols-outlined text-sm text-[var(--primary)]">psychology</span>
              <span className="font-bold">Language Detection &amp; AST Parser</span>
            </motion.div>
          </div>
        </div>

        {/* LEVEL 3: 3 ARCHITECTURAL ENGINE BRANCHES */}
        <div className="grid grid-cols-3 gap-8 mb-[110px]">
          <div className="flex justify-center">
            <TreeBranch
              id="engine_runtime"
              title="Runtime Engine"
              subtitle="JIT &amp; Interpreter"
              icon="speed"
              color="#2DD4BF"
              delay={0.2}
              isActive={isNodeActive("engine_runtime")}
              isDimmed={isNodeDimmed("engine_runtime")}
              onHover={setActiveHoverNode}
              registerRef={registerNodeRef}
            />
          </div>

          <div className="flex justify-center">
            <TreeBranch
              id="engine_compiler"
              title="Compiler Engine"
              subtitle="LLVM &amp; GCC Toolchain"
              icon="memory"
              color="#38BDF8"
              delay={0.3}
              isActive={isNodeActive("engine_compiler")}
              isDimmed={isNodeDimmed("engine_compiler")}
              onHover={setActiveHoverNode}
              registerRef={registerNodeRef}
            />
          </div>

          <div className="flex justify-center">
            <TreeBranch
              id="engine_jvm"
              title="JVM System"
              subtitle="HotSpot &amp; GraalVM"
              icon="coffee"
              color="#A855F7"
              delay={0.4}
              isActive={isNodeActive("engine_jvm")}
              isDimmed={isNodeDimmed("engine_jvm")}
              onHover={setActiveHoverNode}
              registerRef={registerNodeRef}
            />
          </div>
        </div>

        {/* LEVEL 4: LANGUAGE NODES GRID */}
        <div className="grid grid-cols-3 gap-8">
          {/* Runtime Languages Column */}
          <div className="space-y-3">
            {runtimeLangs.map((lang, idx) => (
              <LanguageNode
                key={lang.id}
                data={lang}
                onClick={setSelectedLang}
                delay={0.45 + idx * 0.06}
                isActive={isNodeActive(lang.id)}
                isDimmed={isNodeDimmed(lang.id)}
                onHover={setActiveHoverNode}
                registerRef={registerNodeRef}
              />
            ))}
          </div>

          {/* Compiler Languages Column */}
          <div className="space-y-3">
            {compilerLangs.map((lang, idx) => (
              <LanguageNode
                key={lang.id}
                data={lang}
                onClick={setSelectedLang}
                delay={0.5 + idx * 0.06}
                isActive={isNodeActive(lang.id)}
                isDimmed={isNodeDimmed(lang.id)}
                onHover={setActiveHoverNode}
                registerRef={registerNodeRef}
              />
            ))}
          </div>

          {/* JVM Languages Column */}
          <div className="space-y-3">
            {jvmLangs.map((lang, idx) => (
              <LanguageNode
                key={lang.id}
                data={lang}
                onClick={setSelectedLang}
                delay={0.55 + idx * 0.06}
                isActive={isNodeActive(lang.id)}
                isDimmed={isNodeDimmed(lang.id)}
                onHover={setActiveHoverNode}
                registerRef={registerNodeRef}
              />
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE ACCORDION TREE VIEW */}
      <div className="md:hidden space-y-4 relative z-20">
        <div className="p-4 rounded-xl bg-[var(--card)] border-2 border-[var(--primary)] text-center font-bold text-xs text-[var(--primary)] space-y-1">
          <div>⚡ AI Optimization Platform</div>
          <div className="text-[10px] text-[var(--text-secondary)] font-normal">Language Detection &amp; AST Parser</div>
        </div>

        {[
          { key: "Runtime", title: "Runtime Engine", langs: runtimeLangs, icon: "speed" },
          { key: "Compiler", title: "Compiler Engine", langs: compilerLangs, icon: "memory" },
          { key: "JVM", title: "JVM System", langs: jvmLangs, icon: "coffee" },
        ].map((section) => (
          <div key={section.key} className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <button
              onClick={() =>
                setMobileExpanded((prev) => ({ ...prev, [section.key]: !prev[section.key] }))
              }
              className="w-full p-3.5 bg-[var(--bg-secondary)] flex justify-between items-center text-xs font-bold text-[var(--text-primary)]"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[var(--primary)]">{section.icon}</span>
                <span>{section.title} ({section.langs.length})</span>
              </span>
              <span>{mobileExpanded[section.key] ? "▲" : "▼"}</span>
            </button>

            {mobileExpanded[section.key] && (
              <div className="p-3 space-y-2">
                {section.langs.map((lang) => (
                  <LanguageNode key={lang.id} data={lang} onClick={setSelectedLang} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Popup Drawer */}
      <InfoPopup
        info={selectedLang}
        isOpen={selectedLang !== null}
        onClose={() => setSelectedLang(null)}
      />
    </div>
  );
}
