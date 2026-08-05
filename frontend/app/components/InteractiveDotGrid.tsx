"use client";

import { useEffect, useRef } from "react";

export function InteractiveDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // Grid configuration parameters
    const gap = 32; // 32px grid gap as specified
    const baseRadius = 2; // 2px dot radius as specified
    const idleOpacity = 0.18; // 0.18 idle opacity as specified
    const maxDistance = 140; // Mouse interaction radius

    let mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
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

    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const cols = Math.ceil(window.innerWidth / gap) + 1;
      const rows = Math.ceil(window.innerHeight / gap) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gap;
          const y = j * gap;

          let radius = baseRadius;
          let opacity = idleOpacity;
          let color = `rgba(45, 212, 191, ${opacity})`;

          if (mouse.active) {
            const dx = mouse.x - x;
            const dy = mouse.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDistance) {
              // Distance-based smooth falloff
              const factor = Math.pow(1 - dist / maxDistance, 2);
              opacity = idleOpacity + factor * 0.65;
              radius = baseRadius + factor * 1.5;

              // Glowing teal dot effect
              color = `rgba(87, 241, 219, ${opacity})`;
            }
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

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
