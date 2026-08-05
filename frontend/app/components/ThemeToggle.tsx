"use client";

import { useTheme } from "./ThemeProvider";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--card-elevated)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all shadow-md group overflow-hidden"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex items-center justify-center"
      >
        {theme === "dark" ? (
          <span className="material-symbols-outlined text-lg text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
            light_mode
          </span>
        ) : (
          <span className="material-symbols-outlined text-lg text-teal-600 group-hover:drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">
            dark_mode
          </span>
        )}
      </motion.div>
    </button>
  );
}
