"use client";

// Based on the React Bits "Magnet" component: a subtle pull towards the
// pointer for primary calls to action. Mouse only; respects reduced motion.

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

export default function Magnet({
  children,
  strength = 0.28,
  padding = 60,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  padding?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    const xTo = gsap.quickTo(element, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(element, "y", { duration: 0.6, ease: "power3.out" });

    function onMove(event: PointerEvent) {
      const box = element!.getBoundingClientRect();
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;
      const near =
        Math.abs(event.clientX - centerX) < box.width / 2 + padding &&
        Math.abs(event.clientY - centerY) < box.height / 2 + padding;

      xTo(near ? (event.clientX - centerX) * strength : 0);
      yTo(near ? (event.clientY - centerY) * strength : 0);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.set(element, { x: 0, y: 0 });
    };
  }, [strength, padding]);

  return (
    <span ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </span>
  );
}
