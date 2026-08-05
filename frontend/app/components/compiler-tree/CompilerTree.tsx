"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LanguageNode } from "./LanguageNode";
import { TreeBranch } from "./TreeBranch";
import { InfoPopup, LanguageInfo } from "./InfoPopup";
import { AnimatedConnection } from "./AnimatedConnection";

const LANGUAGE_DATA: LanguageInfo[] = [
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
  {
    id: "swift",
    name: "Swift",
    category: "Compiler",
    compiler: "swiftc 5.9 / LLVM",
    executionEngine: "Native Mach-O Binary",
    typicalSpeed: "+78% speedup",
    memoryRating: "5MB RSS",
    aiConfidence: 95,
    optimizationSupport: "Copy-on-write optimization & ARC reduction",
    outputFormats: ["Native Swift Executable"],
    benchmarkSupport: "XCTest Microbench",
    strategy: "Convert classes to value-type structs to eliminate ARC reference counting overhead.",
    ext: "swift",
    icon: "🕊️",
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

export function CompilerTree() {
  const [selectedLang, setSelectedLang] = useState<LanguageInfo | null>(null);

  const runtimeLangs = LANGUAGE_DATA.filter((l) => l.category === "Runtime");
  const compilerLangs = LANGUAGE_DATA.filter((l) => l.category === "Compiler");
  const jvmLangs = LANGUAGE_DATA.filter((l) => l.category === "JVM");

  return (
    <div className="relative w-full max-w-5xl mx-auto py-10 px-4 font-mono select-none">
      {/* Root Node (Center Top) */}
      <div className="flex justify-center mb-16 relative z-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 170, damping: 20 }}
          className="px-6 py-4 rounded-2xl bg-[#0D1425] border-2 border-[#35F2D0] shadow-[0_0_35px_rgba(53,242,208,0.3)] flex items-center gap-3 text-[#35F2D0] font-bold text-sm"
        >
          <span className="w-3 h-3 rounded-full bg-[#35F2D0] animate-ping" />
          <span>⚡ AI Optimization Platform</span>
        </motion.div>
      </div>

      {/* Level 2 Categories & Level 3 Languages Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-20">
        {/* Branch 1: Runtime Engine */}
        <div className="space-y-6 flex flex-col items-center">
          <TreeBranch
            title="Runtime Engine"
            subtitle="JIT & Interpreter Engine"
            icon="speed"
            color="#35F2D0"
            delay={0.2}
          />
          <div className="w-full space-y-3">
            {runtimeLangs.map((lang, idx) => (
              <LanguageNode
                key={lang.id}
                data={lang}
                onClick={setSelectedLang}
                delay={0.3 + idx * 0.1}
              />
            ))}
          </div>
        </div>

        {/* Branch 2: Compiler Engine */}
        <div className="space-y-6 flex flex-col items-center">
          <TreeBranch
            title="Compiler Engine"
            subtitle="LLVM & GCC Toolchain"
            icon="memory"
            color="#7BE8FF"
            delay={0.3}
          />
          <div className="w-full space-y-3">
            {compilerLangs.map((lang, idx) => (
              <LanguageNode
                key={lang.id}
                data={lang}
                onClick={setSelectedLang}
                delay={0.4 + idx * 0.1}
              />
            ))}
          </div>
        </div>

        {/* Branch 3: JVM System */}
        <div className="space-y-6 flex flex-col items-center">
          <TreeBranch
            title="JVM System"
            subtitle="HotSpot & GraalVM Engine"
            icon="coffee"
            color="#35F2D0"
            delay={0.4}
          />
          <div className="w-full space-y-3">
            {jvmLangs.map((lang, idx) => (
              <LanguageNode
                key={lang.id}
                data={lang}
                onClick={setSelectedLang}
                delay={0.5 + idx * 0.1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal Drawer */}
      <InfoPopup
        info={selectedLang}
        isOpen={selectedLang !== null}
        onClose={() => setSelectedLang(null)}
      />
    </div>
  );
}
