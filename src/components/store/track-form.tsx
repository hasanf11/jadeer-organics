"use client";

import { useActionState } from "react";
import { trackOrder, type TrackResult } from "@/lib/actions/checkout";
import { formatDateTime, money } from "@/lib/format";
import { CUSTOMER_STEPS, STATUS_INFO } from "@/lib/order-status";

export default function TrackForm() {
  const [state, action, pending] = useActionState<TrackResult | null, FormData>(trackOrder, null);

  return (
    <>
      <form action={action} className="card mt-6 grid gap-4 p-5 md:grid-cols-[1fr_1.3fr_auto] md:items-end md:p-6">
        <div className="field">
          <label htmlFor="track-number">Order number</label>
          <input id="track-number" name="number" className="input" inputMode="numeric" placeholder="e.g. 1024" required maxLength={10} />
        </div>
        <div className="field">
          <label htmlFor="track-phone">Phone number</label>
          <input id="track-phone" name="phone" className="input" type="tel" inputMode="tel" placeholder="70 123 456" required maxLength={40} autoComplete="tel" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Checking…" : "Track"}</button>
      </form>

      {state && !state.ok && <p role="alert" className="mt-4 rounded-2xl bg-tomato/10 p-4 font-bold text-tomato">{state.error}</p>}

      {state?.ok && (
        <section className="card mt-6 p-6" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl">Order #{state.order.number}</h2>
            <span className="chip" style={{ color: STATUS_INFO[state.order.status].color, background: STATUS_INFO[state.order.status].bg }}>
              {STATUS_INFO[state.order.status].emoji} {STATUS_INFO[state.order.status].customer}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">Placed {formatDateTime(state.order.createdAt)} · {state.order.zone}</p>
          {state.order.status !== "cancelled" && (
            <div className="mt-5 flex gap-1">
              {CUSTOMER_STEPS.map((step, i) => (
                <span key={step} className={`h-2.5 flex-1 rounded-full ${i <= CUSTOMER_STEPS.indexOf(state.order.status as never) ? "bg-leaf" : "bg-line"}`} />
              ))}
            </div>
          )}
          <ul className="mt-5 grid gap-1 text-ink-soft">
            {state.order.items.map((item, i) => (
              <li key={i}>{item.quantity} × {item.name} ({item.label})</li>
            ))}
          </ul>
          <p className="mt-4 text-lg font-bold">Total: {money(state.order.total)} · cash on delivery</p>
        </section>
      )}
    </>
  );
}
