"use client";

import { PiMinusBold, PiPlusBold } from "react-icons/pi";

export default function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  size = "md",
  label,
  allowZero = false,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  size?: "sm" | "md";
  label: string;
  /** Let the minus button go to zero (removes the line from the bag). */
  allowZero?: boolean;
}) {
  const floor = allowZero ? 0 : min;
  const box = size === "sm" ? "h-9" : "h-12";
  const button = size === "sm" ? "w-9" : "w-12";

  return (
    <div
      className={`inline-flex ${box} items-center rounded-full border-2 border-line bg-white`}
      role="group"
      aria-label={`Quantity for ${label}`}
    >
      <button
        type="button"
        className={`grid ${box} ${button} place-items-center rounded-full transition-colors hover:bg-cream disabled:opacity-35`}
        onClick={() => onChange(Math.max(floor, value - 1))}
        disabled={value <= floor}
        aria-label="Decrease quantity"
      >
        <PiMinusBold size={size === "sm" ? 14 : 16} />
      </button>
      <output className="min-w-7 text-center font-bold tabular-nums" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={`grid ${box} ${button} place-items-center rounded-full transition-colors hover:bg-cream disabled:opacity-35`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <PiPlusBold size={size === "sm" ? 14 : 16} />
      </button>
    </div>
  );
}
