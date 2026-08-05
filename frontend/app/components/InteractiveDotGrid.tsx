"use client";

import { useEffect, useRef } from "react";

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  startTime: number;
}

export function InteractiveDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const gap = 18; // High-density grid (~18px spacing)
    const proximityMaxDist = 180; // 180px proximity radius
    const mouse = { x: -1000, y: -1000, active: false };
    const parallax = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const ripples: Ripple[] = [];
    let lastRippleTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouse.x = mx;
      mouse.y = my;
      mouse.active = true;

      // Parallax target (8-15px)
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      parallax.targetX = ((mx - centerX) / centerX) * 12;
      parallax.targetY = ((my - centerY) / centerY) * 12;

      // Spawn expanding ripple wave every 120ms during movement
      const now = performance.now();
      if (now - lastRippleTime > 120) {
        ripples.push({
          x: mx,
          y: my,
          radius: 10,
          maxRadius: 160,
          opacity: 0.45,
          startTime: now,
        });
        lastRippleTime = now;
        if (ripples.length > 8) ripples.shift();
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
      parallax.targetX = 0;
      parallax.targetY = 0;
    };

    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    handleResize();

    const render = (timestamp: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);

      // Smooth parallax interpolation
      parallax.x += (parallax.targetX - parallax.x) * 0.05;
      parallax.y += (parallax.targetY - parallax.y) * 0.05;

      const isLight = document.documentElement.classList.contains("light");

      // Draw Radial Gradient Glow behind hero
      const heroGlowGrad = ctx.createRadialGradient(
        width / 2 + parallax.x,
        height * 0.35 + parallax.y,
        0,
        width / 2 + parallax.x,
        height * 0.35 + parallax.y,
        width * 0.45
      );
      heroGlowGrad.addColorStop(0, isLight ? "rgba(13, 148, 136, 0.08)" : "rgba(45, 212, 191, 0.08)");
      heroGlowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = heroGlowGrad;
      ctx.fillRect(0, 0, width, height);

      // Update & Draw Ripple Waves
      for (let rIdx = ripples.length - 1; rIdx >= 0; rIdx--) {
        const rip = ripples[rIdx];
        const elapsed = timestamp - rip.startTime;
        const progress = Math.min(1, elapsed / 500); // 500ms wave animation
        rip.radius = 10 + progress * (rip.maxRadius - 10);
        rip.opacity = 0.45 * (1 - progress);

        if (progress >= 1) {
          ripples.splice(rIdx, 1);
        }
      }

      // Idle Oscillation pulse (6% variation)
      const idlePulse = Math.sin(timestamp * 0.0015) * 0.03;
      const idleOffset = Math.cos(timestamp * 0.001) * 1.2;

      const cols = Math.ceil(width / gap) + 2;
      const rows = Math.ceil(height / gap) + 2;

      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const baseX = i * gap + parallax.x;
          const baseY = j * gap + parallax.y + idleOffset * ((i + j) % 2 === 0 ? 1 : -1);

          // Alternating multi-tier base dot sizes (1px, 1.5px, 2px)
          const tierIndex = (i * 3 + j * 7) % 3;
          const baseRadius = tierIndex === 0 ? 1.0 : tierIndex === 1 ? 1.5 : 2.0;

          // Default opacities: primary rgba(45,212,191,.18), secondary .10, white .05
          let baseOpacity = tierIndex === 0 ? 0.18 : tierIndex === 1 ? 0.10 : 0.05;
          baseOpacity += idlePulse;

          let radius = baseRadius;
          let opacity = baseOpacity;
          let color = isLight ? `rgba(15, 23, 42, ${opacity})` : `rgba(45, 212, 191, ${opacity})`;

          // Proximity Glow Calculation (180px max distance)
          if (mouse.active) {
            const dx = mouse.x - baseX;
            const dy = mouse.y - baseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < proximityMaxDist) {
              const factor = Math.pow(1 - dist / proximityMaxDist, 2.2);
              opacity = Math.min(0.9, baseOpacity + factor * 0.7);
              radius = baseRadius + factor * 1.8;
              color = isLight
                ? `rgba(13, 148, 136, ${opacity})`
                : `rgba(87, 241, 219, ${opacity})`;
            }
          }

          // Check Ripple wave interactions
          for (const rip of ripples) {
            const rDx = rip.x - baseX;
            const rDy = rip.y - baseY;
            const rDist = Math.sqrt(rDx * rDx + rDy * rDy);
            if (Math.abs(rDist - rip.radius) < 24) {
              const waveFactor = (1 - Math.abs(rDist - rip.radius) / 24) * rip.opacity;
              opacity = Math.min(0.95, opacity + waveFactor);
              radius = Math.min(3.5, radius + waveFactor * 1.5);
            }
          }

          ctx.beginPath();
          ctx.arc(baseX, baseY, radius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-80 transition-opacity duration-500"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
