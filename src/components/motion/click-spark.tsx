"use client";

// Based on the React Bits "ClickSpark" component: colourful sparks burst
// out wherever the visitor clicks or taps.

import { useEffect, useRef } from "react";

const COLORS = ["#2f8f3a", "#ef4f23", "#ffc93c", "#d23f7c", "#0f8b8d", "#a6d33f"];

type Spark = { x: number; y: number; angle: number; start: number; color: string };

export default function ClickSpark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let sparks: Spark[] = [];
    let frame = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (now: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      sparks = sparks.filter((spark) => {
        const t = (now - spark.start) / 450;
        if (t >= 1) return false;
        const eased = t * (2 - t);
        const distance = eased * 28;
        const length = 10 * (1 - eased);
        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + length) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + length) * Math.sin(spark.angle);
        context.strokeStyle = spark.color;
        context.lineWidth = 2.5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        return true;
      });
      frame = sparks.length ? requestAnimationFrame(draw) : 0;
    };

    const onClick = (event: PointerEvent) => {
      const now = performance.now();
      const count = 9;
      for (let i = 0; i < count; i++) {
        sparks.push({
          x: event.clientX,
          y: event.clientY,
          angle: (2 * Math.PI * i) / count,
          start: now,
          color: COLORS[(i + Math.floor(now)) % COLORS.length],
        });
      }
      if (!frame) frame = requestAnimationFrame(draw);
    };

    window.addEventListener("pointerdown", onClick, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onClick);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] h-screen w-screen"
    />
  );
}
