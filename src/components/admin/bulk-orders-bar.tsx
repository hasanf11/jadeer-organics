"use client";

import { useState } from "react";
import { PiPrinterBold } from "react-icons/pi";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import { bulkSetOrderStatus } from "@/lib/admin-actions/orders";
import { STATUS_INFO } from "@/lib/order-status";

const selected = () => Array.from(new Set(Array.from(document.querySelectorAll<HTMLInputElement>('input[form="bulk-orders"][name="ids"]:checked')).map((i) => i.value)));

/** Act on several orders at once: change their status or print delivery slips. */
export default function BulkOrdersBar() {
  const [hint, setHint] = useState<string | null>(null);

  return (
    <div className="mb-4 rounded-2xl border border-line bg-white p-3">
      <ActionForm action={bulkSetOrderStatus} id="bulk-orders" className="flex flex-wrap items-center gap-2" confirm="Update all selected orders?">
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            className="size-5 accent-[var(--color-leaf)]"
            onChange={(e) => {
              document.querySelectorAll<HTMLInputElement>('input[form="bulk-orders"][name="ids"]').forEach((box) => {
                box.checked = e.target.checked;
              });
            }}
            aria-label="Select all orders on this page"
          />
          Select all
        </label>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        <select name="status" className="input min-h-10 w-auto py-1.5 text-sm" defaultValue="confirmed" aria-label="New status for selected orders">
          {Object.entries(STATUS_INFO).map(([key, info]) => (
            <option key={key} value={key}>Mark as: {info.label}</option>
          ))}
        </select>
        <SubmitButton className="btn btn-primary btn-sm" pendingText="Updating…">Apply to selected</SubmitButton>
        <button
          type="button"
          className="btn btn-soft btn-sm"
          onClick={() => {
            const ids = selected();
            if (!ids.length) {
              setHint("Select orders first.");
              return;
            }
            setHint(null);
            window.open(`/admin/orders/print-slips?ids=${ids.join(",")}`, "_blank", "noopener");
          }}
        >
          <PiPrinterBold aria-hidden="true" /> Print delivery slips
        </button>
        {hint && <span className="text-sm font-bold text-tomato">{hint}</span>}
      </ActionForm>
    </div>
  );
}
