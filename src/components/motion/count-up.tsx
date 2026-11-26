"use client";

// Based on the React Bits "CountUp" component: numbers count up once they
// scroll into view.

import { useEffect, useRef, useState } from "react";

export default function CountUp({
  to,
  duration = 1.6,
  suffix = "",
  prefix = "",
  className = "",
  decimals = 0,
}: {
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const run = (now: number) => {
          const progress = Math.min(1, (now - start) / (duration * 1000));
          const eased = 1 - Math.pow(1 - progress, 4);
          setValue(Number((to * eased).toFixed(decimals)));
          if (progress < 1) frame = requestAnimationFrame(run);
        };
        setValue(0);
        frame = requestAnimationFrame(run);
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}
