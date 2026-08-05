"use client";

import { motion } from "framer-motion";
import { CompilerTree } from "./CompilerTree";
import { BackgroundDots } from "./BackgroundDots";

export function ArchitectureSection() {
  return (
    <section className="relative py-16 overflow-hidden bg-[#050816] rounded-3xl border border-white/[0.08] shadow-2xl my-12">
      {/* Background Dots & Particles */}
      <BackgroundDots />

      <div className="max-w-6xl mx-auto px-4 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-3.5 py-1 rounded-full bg-[#35F2D0]/10 border border-[#35F2D0]/30 text-[#35F2D0] font-mono text-xs font-bold tracking-wider uppercase"
          >
            Compiler Ecosystem Architecture
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight"
          >
            Multi-Language Compiler Support
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm text-[#bacac5] font-mono leading-relaxed max-w-2xl mx-auto"
          >
            Native execution environments powered by GCC, Clang, Rustc, PyPy, Node.js, JVM and modern runtime engines.
          </motion.p>
        </div>

        {/* Interactive Architecture Tree */}
        <CompilerTree />
      </div>
    </section>
  );
}
