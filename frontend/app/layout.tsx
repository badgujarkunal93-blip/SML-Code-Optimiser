import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { InteractiveDotGrid } from "@/app/components/InteractiveDotGrid";

export const metadata: Metadata = {
  title: "Optima AI — Code Optimizer & Performance Engine",
  description: "Developer-first AI code optimization platform powered by Algorand x402, Groq LLM, & Piston Execution Engine",
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
      <body className="bg-[#020617] text-[#dde4e1] antialiased min-h-screen flex flex-col selection:bg-[#2DD4BF]/30 selection:text-[#57f1db] relative overflow-x-hidden">
        {/* Interactive Dot Grid WebGL Canvas Background */}
        <InteractiveDotGrid />

        {/* Optima AI Top NavBar (SaaS Navigation) */}
        <nav className="bg-[#0e1513]/90 backdrop-blur-xl sticky top-0 z-50 border-b border-[#3c4a46]/30 shadow-xl">
          <div className="flex justify-between items-center px-4 sm:px-8 py-3.5 max-w-[1440px] mx-auto w-full">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-2xl font-black tracking-tighter text-[#57f1db] flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#57f1db]/10 border border-[#57f1db]/30 flex items-center justify-center text-emerald-400 text-lg shadow-lg shadow-[#57f1db]/10 group-hover:scale-105 transition-transform">
                  ⚡
                </span>
                Optima AI
              </span>
            </Link>

            {/* Reusable SaaS Routes */}
            <div className="hidden md:flex gap-6 items-center text-xs font-mono font-semibold">
              <Link
                href="/"
                className="text-[#bacac5] hover:text-[#57f1db] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#57f1db]/10"
              >
                Home
              </Link>
              <Link
                href="/workspace"
                className="text-[#57f1db] font-bold py-1.5 px-3 rounded-lg bg-[#2DD4BF]/10 border border-[#2DD4BF]/30"
              >
                Workspace (IDE)
              </Link>
              <Link
                href="/results"
                className="text-[#bacac5] hover:text-[#57f1db] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#57f1db]/10"
              >
                Results
              </Link>
              <Link
                href="/dashboard"
                className="text-[#bacac5] hover:text-[#57f1db] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#57f1db]/10"
              >
                Analytics
              </Link>
              <Link
                href="/history"
                className="text-[#bacac5] hover:text-[#57f1db] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#57f1db]/10"
              >
                History
              </Link>
              <Link
                href="/settings"
                className="text-[#bacac5] hover:text-[#57f1db] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#57f1db]/10"
              >
                Settings
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/workspace"
                className="bg-[#2DD4BF] hover:bg-[#57f1db] text-[#020617] font-mono font-bold text-xs px-5 py-2 rounded-full shadow-lg shadow-[#2DD4BF]/20 transition-all hover-scale"
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
        <footer className="bg-[#0e1513] border-t border-[#3c4a46]/20 mt-16 py-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-8 max-w-[1440px] mx-auto font-mono text-xs text-[#bacac5] w-full gap-4">
            <div>© 2026 Optima AI. Developer-First Code Optimization SaaS Platform.</div>
            <div className="flex flex-wrap gap-6">
              <Link href="/" className="hover:text-[#57f1db] transition-colors">
                Home
              </Link>
              <Link href="/workspace" className="hover:text-[#57f1db] transition-colors">
                Workspace
              </Link>
              <Link href="/results" className="hover:text-[#57f1db] transition-colors">
                Results
              </Link>
              <Link href="/dashboard" className="hover:text-[#57f1db] transition-colors">
                Analytics
              </Link>
              <Link href="/history" className="hover:text-[#57f1db] transition-colors">
                History
              </Link>
              <Link href="/settings" className="hover:text-[#57f1db] transition-colors">
                Settings
              </Link>
            </div>
            <div className="font-bold tracking-widest text-[#57f1db] hidden md:block">
              OPTIMA AI
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
