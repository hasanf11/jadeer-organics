"use client";

// Based on the React Bits "RotatingText" component: words take turns,
// each sliding in letter by letter.

import { useEffect, useState } from "react";

export default function RotatingText({
  texts,
  interval = 2600,
  className = "",
}: {
  texts: { text: string; className?: string }[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % texts.length), interval);
    return () => window.clearInterval(id);
  }, [interval, texts.length]);

  const current = texts[index];

  return (
    <span className={`relative inline-flex ${className}`}>
      <span className="sr-only">{texts.map((t) => t.text).join(", ")}</span>
      <span
        key={current.text}
        aria-hidden="true"
        className={`inline-flex animate-[pop_0.5s_cubic-bezier(0.2,1.4,0.4,1)] overflow-hidden rounded-[0.18em] px-[0.18em] py-[0.04em] leading-[1.08] ${current.className ?? ""}`}
      >
        {Array.from(current.text).map((char, i) => (
          <span
            key={i}
            className="inline-block animate-[letter-in_0.55s_cubic-bezier(0.2,0.9,0.3,1)_both] whitespace-pre"
            style={{ animationDelay: `${i * 28}ms` }}
          >
            {char}
          </span>
        ))}
      </span>
    </span>
  );
}
