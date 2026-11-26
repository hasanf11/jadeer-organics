"use client";

// Based on the React Bits "SplitText" component, adapted for SMYL:
// it keeps the server-rendered heading intact for SEO and accessibility
// and only animates once fonts are ready.

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { SplitText as GsapSplitText } from "gsap/SplitText";

gsap.registerPlugin(GsapSplitText);

type SplitTextProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  id?: string;
  splitType?: "chars" | "words" | "lines";
  delay?: number;
  stagger?: number;
  duration?: number;
};

export default function SplitText({
  as: Tag = "h2",
  children,
  className,
  id,
  splitType = "words",
  delay = 0.1,
  stagger = 0.06,
  duration = 1.1,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let split: GsapSplitText | undefined;
    let tween: gsap.core.Tween | undefined;
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled) return;

      split = GsapSplitText.create(element, {
        type: splitType === "lines" ? "lines" : `words${splitType === "chars" ? ",chars" : ""}`,
        mask: splitType === "chars" ? undefined : splitType,
        aria: "auto",
      });

      // The masks hide each word until it slides in. Give them a little
      // breathing room so slanted (italic) letters such as the "e" in
      // "Smile" are not clipped at the edge, without shifting the layout.
      for (const mask of split.masks) {
        if (!(mask instanceof HTMLElement)) continue;
        mask.style.padding = "0.12em 0.3em";
        mask.style.margin = "-0.12em -0.3em";
      }

      const targets =
        splitType === "chars" ? split.chars : splitType === "lines" ? split.lines : split.words;

      tween = gsap.from(targets, {
        yPercent: 110,
        opacity: 0,
        duration,
        delay,
        stagger,
        ease: "expo.out",
        onComplete: () => split?.revert(),
      });
    });

    return () => {
      cancelled = true;
      tween?.kill();
      split?.revert();
    };
  }, [splitType, delay, stagger, duration]);

  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}
