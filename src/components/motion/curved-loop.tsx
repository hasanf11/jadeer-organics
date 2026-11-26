"use client";

// Based on the React Bits "CurvedLoop" component: a marquee that flows
// along a gentle wave.

import { useEffect, useId, useRef, useState } from "react";

export default function CurvedLoop({
  text,
  speed = 0.6,
  className = "",
  curve = 60,
}: {
  text: string;
  speed?: number;
  className?: string;
  curve?: number;
}) {
  const pathId = useId().replace(/:/g, "");
  const measureRef = useRef<SVGTextElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const [width, setWidth] = useState(0);

  const repeated = Array(12).fill(text).join(" ✦ ") + " ✦ ";

  useEffect(() => {
    if (measureRef.current) setWidth(measureRef.current.getComputedTextLength());
  }, [text]);

  useEffect(() => {
    if (!width || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const unit = width;
    let offset = -unit;
    let frame = 0;
    const step = () => {
      offset += speed;
      if (offset >= 0) offset -= unit;
      textPathRef.current?.setAttribute("startOffset", `${offset}px`);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [width, speed]);

  return (
    <div className={`w-full overflow-hidden ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1440 160" className="block w-full select-none" preserveAspectRatio="none">
        <text ref={measureRef} xmlSpace="preserve" className="invisible" style={{ visibility: "hidden" }}>
          {text + " ✦ "}
        </text>
        <defs>
          <path id={pathId} d={`M-100,80 Q520,${80 + curve} 720,80 T1540,80`} fill="none" />
        </defs>
        <text xmlSpace="preserve" className="fill-current">
          <textPath ref={textPathRef} href={`#${pathId}`} startOffset="0px">
            {repeated}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
