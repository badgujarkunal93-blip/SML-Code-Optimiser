import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpeedOptimizer AI — High Performance Code Optimization",
  description: "AI-powered automated code optimization and execution benchmarking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 p-2 rounded-lg font-black text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                ⚡
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  SpeedOptimizer <span className="text-emerald-400">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">
                  LLM Code Benchmarking
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Optimizer
              </Link>
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Dashboard
              </Link>
              <div className="h-4 w-px bg-slate-800 my-auto hidden sm:block" />
              <div className="items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hidden sm:flex">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Backend Ready
              </div>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-800 bg-slate-900/50 py-6 text-center text-xs text-slate-500">
          <p>© 2026 SpeedOptimizer AI — Powered by Groq llama-3.3-70b & Piston Execution Engine</p>
        </footer>
      </body>
    </html>
  );
}
