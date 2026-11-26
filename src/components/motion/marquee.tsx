import type { ReactNode } from "react";

/** A smooth, endless CSS marquee (no JavaScript, no scroll listeners). */
export default function Marquee({
  children,
  className = "",
  duration = 50,
  pauseOnHover = false,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  pauseOnHover?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden ${pauseOnHover ? "marquee-pause" : ""} ${className}`}>
      <div className="marquee" style={{ animationDuration: `${duration}s` }}>
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
