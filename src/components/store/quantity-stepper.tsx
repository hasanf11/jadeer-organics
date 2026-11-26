"use client";

import { PiMinusBold, PiPlusBold } from "react-icons/pi";
import { useI18n } from "@/components/i18n-provider";

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
  const { t } = useI18n();
  const floor = allowZero ? 0 : min;
  const box = size === "sm" ? "h-9" : "h-12";
  const button = size === "sm" ? "w-9" : "w-12";

  return (
    <div className={`inline-flex ${box} items-center rounded-full bg-white shadow-[inset_0_0_0_1.5px_var(--color-line)]`} role="group" aria-label={`${t.product.quantity}: ${label}`}>
      <button
        type="button"
        className={`grid ${box} ${button} place-items-center rounded-full transition-colors hover:bg-sand disabled:opacity-35`}
        onClick={() => onChange(Math.max(floor, value - 1))}
        disabled={value <= floor}
        aria-label={t.product.decrease}
      >
        <PiMinusBold size={size === "sm" ? 13 : 16} />
      </button>
      <output className="min-w-7 text-center font-bold tabular-nums" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={`grid ${box} ${button} place-items-center rounded-full transition-colors hover:bg-sand disabled:opacity-35`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={t.product.increase}
      >
        <PiPlusBold size={size === "sm" ? 13 : 16} />
      </button>
    </div>
  );
}
