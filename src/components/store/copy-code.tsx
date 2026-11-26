"use client";

import { useState } from "react";
import { PiCheckBold, PiCopyBold } from "react-icons/pi";
import { useI18n } from "@/components/i18n-provider";

export default function CopyCode({ code }: { code: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-5 flex items-center gap-2 rounded-2xl border-2 border-dashed border-berry/40 bg-blush p-2 ps-4">
      <span className="flex-1 font-mono text-xl font-bold tracking-wider text-berry" dir="ltr">{code}</span>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard blocked */
          }
        }}
      >
        {copied ? <PiCheckBold aria-hidden="true" /> : <PiCopyBold aria-hidden="true" />} {copied ? t.offers.copied : t.offers.copy}
      </button>
    </div>
  );
}
