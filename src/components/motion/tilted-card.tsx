"use client";

// Based on the React Bits "TiltedCard" component: the card tilts in 3D
// towards the pointer. Mouse only.

import { useRef, type ReactNode } from "react";

export default function TiltedCard({
  children,
  className = "",
  max = 10,
  scale = 1.03,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function reset() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div style={{ perspective: 900 }} className={className}>
      <div
        ref={ref}
        className="h-full transition-transform duration-300 ease-out will-change-transform [transform-style:preserve-3d]"
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse" || !ref.current) return;
          const box = ref.current.getBoundingClientRect();
          const x = (event.clientX - box.left) / box.width - 0.5;
          const y = (event.clientY - box.top) / box.height - 0.5;
          ref.current.style.transform = `rotateX(${-y * max}deg) rotateY(${x * max}deg) scale(${scale})`;
        }}
        onPointerLeave={reset}
      >
        {children}
      </div>
    </div>
  );
}
