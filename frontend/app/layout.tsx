import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { InteractiveDotGrid } from "@/app/components/InteractiveDotGrid";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { ThemeToggle } from "@/app/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Optima AI — Autonomous Code Optimization Platform",
  description: "Enterprise AI code optimization, wall-clock benchmarking, multi-compiler execution, and Algorand x402 settlement protocol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text-primary)] antialiased min-h-screen flex flex-col selection:bg-[#2DD4BF]/30 selection:text-[#2DD4BF] relative overflow-x-hidden transition-colors duration-300">
        <ThemeProvider>
          {/* Interactive Dot Grid Background Canvas */}
          <InteractiveDotGrid />

          {/* Optima AI Enterprise Top Navigation */}
          <nav className="bg-[var(--bg)]/90 backdrop-blur-xl sticky top-0 z-50 border-b border-[var(--border)] shadow-sm">
            <div className="flex justify-between items-center px-4 sm:px-8 py-3.5 max-w-[1440px] mx-auto w-full">
              <Link href="/" className="flex items-center gap-3 group">
                <span className="text-xl font-black tracking-tighter text-[var(--text-primary)] flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] text-lg shadow-md group-hover:scale-105 transition-transform">
                    ⚡
                  </span>
                  Optima AI
                </span>
              </Link>

              {/* Reusable SaaS Routes */}
              <div className="hidden md:flex gap-6 items-center text-xs font-mono font-semibold">
                <Link
                  href="/"
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors py-1.5 px-3 rounded-lg hover:bg-[var(--card-elevated)]"
                >
                  Home
                </Link>
                <Link
                  href="/workspace"
                  className="text-[var(--primary)] font-bold py-1.5 px-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30"
                >
                  Workspace (IDE)
                </Link>
                <Link
                  href="/results"
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors py-1.5 px-3 rounded-lg hover:bg-[var(--card-elevated)]"
                >
                  Results
                </Link>
                <Link
                  href="/dashboard"
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors py-1.5 px-3 rounded-lg hover:bg-[var(--card-elevated)]"
                >
                  Analytics
                </Link>
                <Link
                  href="/history"
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors py-1.5 px-3 rounded-lg hover:bg-[var(--card-elevated)]"
                >
                  History
                </Link>
                <Link
                  href="/settings"
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors py-1.5 px-3 rounded-lg hover:bg-[var(--card-elevated)]"
                >
                  Settings
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link
                  href="/workspace"
                  className="bg-[#2DD4BF] hover:bg-[#57f1db] text-[#07101A] font-mono font-bold text-xs px-5 py-2 rounded-full shadow-lg shadow-[#2DD4BF]/20 transition-all hover-scale"
                >
                  Optimize Now →
                </Link>
              </div>
            </div>
          </nav>

          <main className="flex-grow flex flex-col w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-6 relative z-10">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border)] mt-16 py-8 relative z-10 transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-8 max-w-[1440px] mx-auto font-mono text-xs text-[var(--text-secondary)] w-full gap-4">
              <div>© 2026 Optima AI. Developer-First Autonomous Code Optimization Platform.</div>
              <div className="flex flex-wrap gap-6">
                <Link href="/" className="hover:text-[var(--primary)] transition-colors">
                  Home
                </Link>
                <Link href="/workspace" className="hover:text-[var(--primary)] transition-colors">
                  Workspace
                </Link>
                <Link href="/results" className="hover:text-[var(--primary)] transition-colors">
                  Results
                </Link>
                <Link href="/dashboard" className="hover:text-[var(--primary)] transition-colors">
                  Analytics
                </Link>
                <Link href="/history" className="hover:text-[var(--primary)] transition-colors">
                  History
                </Link>
                <Link href="/settings" className="hover:text-[var(--primary)] transition-colors">
                  Settings
                </Link>
              </div>
              <div className="font-bold tracking-widest text-[var(--primary)] hidden md:block">
                OPTIMA AI
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
