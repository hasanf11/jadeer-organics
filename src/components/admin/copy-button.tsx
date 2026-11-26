"use client";

import { useState } from "react";
import { PiCheckBold, PiCopyBold } from "react-icons/pi";

export default function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-soft btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          window.prompt("Copy this:", value);
        }
      }}
    >
      {copied ? <PiCheckBold aria-hidden="true" /> : <PiCopyBold aria-hidden="true" />} {copied ? "Copied" : label}
    </button>
  );
}
