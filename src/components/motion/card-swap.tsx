"use client";

// Based on the React Bits "CardSwap" component: a 3D stack of cards where
// the front card drops away and returns to the back, on a loop.

import { Children, useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

export default function CardSwap({
  children,
  width = 300,
  height = 380,
  distanceX = 46,
  distanceY = 52,
  delay = 4200,
  className = "",
}: {
  children: ReactNode;
  width?: number;
  height?: number;
  distanceX?: number;
  distanceY?: number;
  delay?: number;
  className?: string;
}) {
  const items = Children.toArray(children);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const order = useRef<number[]>(items.map((_, i) => i));
  const rtl = useRef(false);

  useEffect(() => {
    rtl.current = document.documentElement.dir === "rtl";
    const direction = rtl.current ? -1 : 1;
    const total = refs.current.length;
    const slot = (i: number) => ({
      x: i * distanceX * direction,
      y: -i * distanceY,
      z: -i * distanceX * 1.5,
      zIndex: total - i,
    });

    refs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, { ...slot(i), xPercent: -50, yPercent: -50, skewY: 6 * direction, transformOrigin: "center center", force3D: true });
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || total < 2) return;

    let timeline: gsap.core.Timeline | null = null;
    const swap = () => {
      const [front, ...rest] = order.current;
      const el = refs.current[front];
      if (!el) return;
      timeline = gsap.timeline();
      timeline.to(el, { y: "+=420", duration: 1.6, ease: "elastic.inOut(0.6,0.9)" });
      timeline.addLabel("promote", "-=1.1");
      rest.forEach((index, i) => {
        const card = refs.current[index];
        if (!card) return;
        timeline!.set(card, { zIndex: total - i }, "promote");
        const target = slot(i);
        timeline!.to(card, { x: target.x, y: target.y, z: target.z, duration: 1.6, ease: "elastic.inOut(0.6,0.9)" }, `promote+=${i * 0.12}`);
      });
      const back = slot(total - 1);
      timeline.addLabel("return", "promote+=0.2");
      timeline.call(() => { gsap.set(el, { zIndex: back.zIndex }); }, undefined, "return");
      timeline.to(el, { x: back.x, y: back.y, z: back.z, duration: 1.6, ease: "elastic.inOut(0.6,0.9)" }, "return");
      timeline.call(() => { order.current = [...rest, front]; });
    };

    let visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    if (refs.current[0]?.parentElement) observer.observe(refs.current[0].parentElement);
    const interval = window.setInterval(() => { if (visible && !document.hidden) swap(); }, delay);

    return () => {
      window.clearInterval(interval);
      observer.disconnect();
      timeline?.kill();
    };
  }, [delay, distanceX, distanceY]);

  return (
    <div className={`relative [perspective:900px] ${className}`} style={{ width, height }}>
      {items.map((child, i) => (
        <div
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className="absolute left-1/2 top-1/2 overflow-hidden rounded-3xl border border-white/30 shadow-pop [backface-visibility:hidden] [transform-style:preserve-3d] will-change-transform"
          style={{ width, height }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
