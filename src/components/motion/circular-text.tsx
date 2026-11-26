"use client";

// Based on the React Bits "CircularText" component: text spinning around a
// circle, faster while hovered.

import type { ReactNode } from "react";

export default function CircularText({
  text,
  size = 150,
  className = "",
  children,
}: {
  text: string;
  size?: number;
  className?: string;
  children?: ReactNode;
}) {
  const letters = Array.from(text);
  const step = 360 / letters.length;

  return (
    <div
      className={`group relative grid place-items-center rounded-full ${className}`}
      style={{ width: size, height: size }}
      aria-label={text}
      role="img"
    >
      <div
        className="absolute inset-0 animate-[spin-slow_18s_linear_infinite] group-hover:animate-[spin-slow_5s_linear_infinite]"
        aria-hidden="true"
      >
        {letters.map((letter, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-0 h-1/2 origin-bottom text-[0.8rem] font-extrabold uppercase"
            style={{ transform: `translateX(-50%) rotate(${i * step}deg)` }}
          >
            {letter}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}
