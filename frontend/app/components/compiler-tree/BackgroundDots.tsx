"use client";

export function BackgroundDots() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-30">
      {/* Soft Radial Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--primary)]/10 via-sky-500/5 to-transparent blur-3xl rounded-full" />

      {/* Orbiting Tiny Particles */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-48 border border-[var(--primary)]/20 rounded-full animate-spin-slow pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-[var(--primary)] shadow-[0_0_10px_var(--primary)] absolute -top-1 left-1/2 -translate-x-1/2" />
        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_sky-400] absolute -bottom-1 left-1/2 -translate-x-1/2" />
      </div>
    </div>
  );
}
