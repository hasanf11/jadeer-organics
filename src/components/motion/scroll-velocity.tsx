"use client";

// Based on the React Bits "ScrollVelocity" component: an endless ticker
// that speeds up and changes direction with the visitor's scroll.

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

export default function ScrollVelocity({
  items,
  speed = 50,
  reverse = false,
  className = "",
  itemClassName = "",
  separator = "·",
}: {
  items: ReactNode[];
  speed?: number;
  reverse?: boolean;
  className?: string;
  itemClassName?: string;
  separator?: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let offset = 0;
    let direction = reverse ? 1 : -1;
    let boost = 0;
    let lastScroll = window.scrollY;

    const tick = (_time: number, deltaMs: number) => {
      const scrollY = window.scrollY;
      const delta = scrollY - lastScroll;
      lastScroll = scrollY;
      if (delta !== 0) direction = (delta > 0 ? -1 : 1) * (reverse ? -1 : 1);
      boost = gsap.utils.clamp(0, 6, boost * 0.92 + Math.abs(delta) * 0.03);

      const half = track.scrollWidth / 2;
      offset += direction * speed * (1 + boost) * (deltaMs / 1000);
      if (offset <= -half) offset += half;
      if (offset > 0) offset -= half;
      gsap.set(track, { x: offset });
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [speed, reverse]);

  const sequence = items.map((item, index) => (
    <span key={index} className={`inline-flex items-center gap-6 pr-6 ${itemClassName}`}>
      {item}
      <span aria-hidden="true" className="opacity-70">{separator}</span>
    </span>
  ));

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-hidden="true">
      <div ref={trackRef} className="inline-flex will-change-transform">
        {sequence}
        {sequence}
        {sequence}
        {sequence}
      </div>
    </div>
  );
}
