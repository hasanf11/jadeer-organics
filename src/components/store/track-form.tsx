"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { useStore } from "@/components/store/store-provider";
import StatusIcon from "@/components/status-icon";
import { trackOrder, type TrackResult } from "@/lib/actions/checkout";
import { formatDateTime, money } from "@/lib/format";
import { CUSTOMER_STEPS, STATUS_INFO } from "@/lib/order-status";
import { localizeLabel } from "@/lib/i18n/config";

export default function TrackForm() {
  const { t, locale, href } = useI18n();
  const { products } = useStore();
  const [state, action, pending] = useActionState<TrackResult | null, FormData>(trackOrder, null);
  const nameFor = (slug: string, fallback: string) => products.find((p) => p.slug === slug)?.name ?? fallback;

  return (
    <>
      <form action={action} className="mt-6 grid gap-4 rounded-3xl bg-paper p-5 shadow-soft md:grid-cols-[1fr_1.3fr_auto] md:items-end md:p-6">
        <input type="hidden" name="locale" value={locale} />
        <div className="field">
          <label htmlFor="track-number">{t.track.number}</label>
          <input id="track-number" name="number" className="input" inputMode="numeric" dir="ltr" placeholder="1024" required maxLength={10} />
        </div>
        <div className="field">
          <label htmlFor="track-phone">{t.track.phone}</label>
          <input id="track-phone" name="phone" className="input" type="tel" inputMode="tel" dir="ltr" placeholder="70 123 456" required maxLength={40} autoComplete="tel" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? t.track.checking : t.track.submit}</button>
      </form>

      {state && !state.ok && <p role="alert" className="mt-4 rounded-2xl bg-tomato/10 p-4 font-bold text-tomato">{state.error}</p>}

      {state?.ok && (
        <section className="mt-6 rounded-3xl bg-paper p-6 shadow-soft" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl">{t.order.number(state.order.number)}</h2>
            <span className="chip" style={{ color: STATUS_INFO[state.order.status].color, background: STATUS_INFO[state.order.status].bg }}>
              <StatusIcon status={state.order.status} size={14} /> {t.status[state.order.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">{t.track.placed(formatDateTime(state.order.createdAt, locale), state.order.zone)}</p>
          {state.order.status !== "cancelled" && (
            <div className="mt-5 flex gap-1" aria-hidden="true">
              {CUSTOMER_STEPS.map((step, i) => (
                <span key={step} className={`h-2.5 flex-1 rounded-full ${i <= CUSTOMER_STEPS.indexOf(state.order.status as never) ? "bg-leaf" : "bg-line"}`} />
              ))}
            </div>
          )}
          <ul className="mt-5 grid gap-1 text-ink-soft">
            {state.order.items.map((item, i) => (
              <li key={i}>
                {item.quantity} × <Link href={href(`/products/${item.slug}`)} className="hover:text-ink">{nameFor(item.slug, item.name)}</Link> ({localizeLabel(item.label, locale)})
              </li>
            ))}
          </ul>
          <p className="mt-4 text-lg font-bold">{t.track.totalCod(money(state.order.total))}</p>
        </section>
      )}
    </>
  );
}
