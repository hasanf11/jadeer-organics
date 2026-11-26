"use client";

// Based on the React Bits "AnimatedContent" component: content eases into
// place as it scrolls into view. Elements already on screen when the page
// loads are left alone, so nothing flashes or hides above the fold.

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type RevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  distance?: number;
  delay?: number;
  duration?: number;
  /** Animate direct children one after another. */
  stagger?: number;
} & Record<string, unknown>;

export default function Reveal({
  as: Tag = "div",
  children,
  className,
  distance = 48,
  delay = 0,
  duration = 1.1,
  stagger = 0,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    const targets = stagger > 0 ? Array.from(element.children) : element;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y: distance,
        opacity: 0,
        duration,
        delay,
        stagger,
        ease: "power3.out",
        clearProps: "transform,opacity",
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true,
        },
      });
    }, element);

    return () => ctx.revert();
  }, [distance, delay, duration, stagger]);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
