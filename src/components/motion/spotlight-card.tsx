"use client";

// Based on the React Bits "SpotlightCard" component: a soft coloured light
// follows the pointer across the card.

import { useRef, type CSSProperties, type ReactNode } from "react";

export default function SpotlightCard({
  children,
  className = "",
  color = "rgb(255 201 60 / 0.35)",
  style,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={`group/spot relative isolate overflow-hidden ${className}`}
      style={style}
      onPointerMove={(event) => {
        const box = ref.current?.getBoundingClientRect();
        if (!box || !ref.current) return;
        ref.current.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
        ref.current.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${color}, transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
}
