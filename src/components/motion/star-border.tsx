// Based on the React Bits "StarBorder" component: a soft light travels
// around the edge of a button.

import type { ReactNode } from "react";

export default function StarBorder({ children, color = "#f3b43c", className = "" }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span className={`relative inline-block overflow-hidden rounded-full p-[2px] ${className}`}>
      <span
        aria-hidden="true"
        className="absolute -bottom-3 end-[-250%] z-0 h-1/2 w-[300%] rounded-full opacity-70 motion-safe:animate-[star-move-bottom_5s_linear_infinite_alternate]"
        style={{ background: `radial-gradient(circle, ${color}, transparent 12%)` }}
      />
      <span
        aria-hidden="true"
        className="absolute -top-3 start-[-250%] z-0 h-1/2 w-[300%] rounded-full opacity-70 motion-safe:animate-[star-move-top_5s_linear_infinite_alternate]"
        style={{ background: `radial-gradient(circle, ${color}, transparent 12%)` }}
      />
      <span className="relative z-[1] block">{children}</span>
    </span>
  );
}
