"use client";

// Based on the React Bits "BlurText" component: words come into focus one
// after another. The whole sentence is in the HTML for search engines.

import { useEffect, useRef, useState, type ElementType } from "react";

export type BlurPart = { text: string; className?: string };

export default function BlurText({
  as: Tag = "h2",
  parts,
  className = "",
  delay = 90,
}: {
  as?: ElementType;
  parts: BlurPart[];
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  let index = 0;
  return (
    <Tag ref={ref} className={className}>
      {parts.map((part, p) => (
        <span key={p} className={part.className}>
          {part.text.split(/(\s+)/).map((word, w) => {
            if (word === "" || /^\s+$/.test(word)) return word;
            const order = index++;
            return (
              <span
                key={w}
                className="inline-block transition-[filter,opacity,transform] duration-700 ease-out motion-reduce:!transform-none motion-reduce:!opacity-100 motion-reduce:![filter:none]"
                style={{
                  transitionDelay: `${order * delay}ms`,
                  filter: shown ? "blur(0)" : "blur(10px)",
                  opacity: shown ? 1 : 0,
                  transform: shown ? "none" : "translateY(0.25em)",
                }}
              >
                {word}
              </span>
            );
          })}
          {p < parts.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
