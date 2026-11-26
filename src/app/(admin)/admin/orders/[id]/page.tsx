import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PiArrowLeftBold,
  PiEnvelopeSimpleBold,
  PiMapPinBold,
  PiPhoneBold,
  PiPrinterBold,
  PiWhatsappLogoBold,
} from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, money } from "@/lib/format";
import { CUSTOMER_STEPS, PAYMENT_INFO, STATUS_INFO } from "@/lib/order-status";
import { orderWhatsAppMessage, whatsAppHref } from "@/lib/order-whatsapp";
import { orderTrackingUrl } from "@/lib/emails";
import { googleMapsUrl } from "@/lib/maps";
import { resendOrderEmail, setOrderPayment, setOrderStatus, saveOrderNotes } from "@/lib/admin-actions/orders";
import CopyButton from "@/components/admin/copy-button";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import { Panel, Pill } from "@/components/admin/ui";
import StatusIcon from "@/components/status-icon";

export const metadata: Metadata = { title: "Order" };
export const instant = false;

const NEXT_STEP: Record<string, { status: string; label: string }> = {
  pending: { status: "confirmed", label: " Confirm order" },
  confirmed: { status: "preparing", label: " Start preparing" },
  preparing: { status: "out_for_delivery", label: " Send out for delivery" },
  out_for_delivery: { status: "delivered", label: " Mark as delivered (paid)" },
};

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: order }, { data: events }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(id, product_id, product_name, variant_label, unit_price_cents, quantity, line_total_cents)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("order_events").select("id, kind, from_value, to_value, note, created_at").eq("order_id", id).order("created_at"),
  ]);
  if (!order) notFound();

  const { count: previousOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_phone", order.customer_phone)
    .neq("id", order.id);

  const status = STATUS_INFO[order.status];
  const next = NEXT_STEP[order.status];
  const locale = order.locale === "ar" ? "ar" : "en";
  const trackingUrl = orderTrackingUrl(locale, order.tracking_token);
  let zone = order.delivery_zone_name;
  if (locale === "ar" && order.delivery_zone_id) {
    const { data: z } = await supabase.from("delivery_zones").select("name_ar").eq("id", order.delivery_zone_id).maybeSingle();
    if (z?.name_ar) zone = z.name_ar;
  }
  const message = orderWhatsAppMessage({
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    orderNumber: order.order_number,
    status: order.status,
    zone,
    totalCents: order.total_cents,
    locale,
    trackingUrl,
  });
  const stepIndex = CUSTOMER_STEPS.indexOf(order.status);

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-bold text-ink-soft hover:text-ink">
          <PiArrowLeftBold /> All orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Order #{order.order_number}</h1>
            <p className="text-ink-soft">Placed {formatDateTime(order.created_at)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill color={status.color} bg={status.bg}>{status.label}</Pill>
            <Pill color={PAYMENT_INFO[order.payment_status].color} bg={PAYMENT_INFO[order.payment_status].bg}>
              {PAYMENT_INFO[order.payment_status].label}
            </Pill>
            <Pill color="#5a5f58" bg="#efe9dc">{locale === "ar" ? "Arabic site" : "English site"}</Pill>
            <Link href={`/admin/orders/${order.id}/print`} target="_blank" className="btn btn-soft btn-sm">
              <PiPrinterBold /> Print invoice
            </Link>
          </div>
        </div>
      </div>

      {order.status !== "cancelled" && (
        <ol className="grid grid-cols-5 gap-1 rounded-3xl bg-white p-4" aria-label="Order progress">
          {CUSTOMER_STEPS.map((step, i) => (
            <li key={step} className="text-center">
              <span className={`mx-auto grid size-10 place-items-center rounded-full text-lg ${i <= stepIndex ? "bg-mint" : "bg-cream grayscale"}`}>
                <StatusIcon status={step} size={16} />
              </span>
              <span className={`mt-1 block text-[0.7rem] font-bold md:text-xs ${i <= stepIndex ? "" : "text-ink-soft"}`}>{STATUS_INFO[step].label}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title="Next step">
            <div className="flex flex-wrap gap-2">
              {next && (
                <ActionForm action={setOrderStatus} className="contents">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="status" value={next.status} />
                  <SubmitButton pendingText="Updating…" className="btn btn-primary">{next.label}</SubmitButton>
                </ActionForm>
              )}
              <a href={whatsAppHref(order.customer_phone, message)} target="_blank" rel="noopener noreferrer" className="btn bg-[#25d366] text-white">
                <PiWhatsappLogoBold size={20} /> Send “{status.label}” WhatsApp
              </a>
            </div>
            <details className="mt-4 rounded-2xl bg-cream p-3">
              <summary className="cursor-pointer text-sm font-bold">Preview the message ({locale === "ar" ? "Arabic" : "English"})</summary>
              <p className="mt-2 whitespace-pre-line text-sm text-ink-soft" dir={locale === "ar" ? "rtl" : "ltr"}>{message}</p>
            </details>
            {trackingUrl && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold">Customer&apos;s private tracking link:</span>
                <CopyButton value={trackingUrl} label="Copy link" />
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-leaf underline">Open</a>
              </div>
            )}
            {order.customer_email && order.status !== "pending" && (
              <ActionForm action={resendOrderEmail} className="mt-3">
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="kind" value={order.status} />
                <SubmitButton className="btn btn-soft btn-sm" pendingText="Sending…">Re-send “{status.label}” email</SubmitButton>
              </ActionForm>
            )}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-bold text-ink-soft">Set another status</summary>
              <ActionForm action={setOrderStatus} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]" confirm="Change this order's status?">
                <input type="hidden" name="id" value={order.id} />
                <select name="status" className="input" defaultValue={order.status} aria-label="Status">
                  {Object.entries(STATUS_INFO).map(([key, info]) => (
                    <option key={key} value={key}>{info.label}</option>
                  ))}
                </select>
                <input name="note" className="input" placeholder="Note (optional)" maxLength={300} aria-label="Note" />
                <SubmitButton className="btn btn-ink">Update</SubmitButton>
              </ActionForm>
              <p className="mt-2 text-xs text-ink-soft">Cancelling puts the items back in stock. Reopening a cancelled order takes them out again.</p>
            </details>
          </Panel>

          <Panel title={`Items (${order.order_items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0)})`}>
            <ul className="divide-y divide-line">
              {order.order_items.map((item: { id: string; product_id: string | null; product_name: string; variant_label: string; unit_price_cents: number; quantity: number; line_total_cents: number }) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <span>
                    {item.product_id ? (
                      <Link href={`/admin/products/${item.product_id}`} className="font-bold hover:text-leaf">{item.product_name}</Link>
                    ) : (
                      <span className="font-bold">{item.product_name}</span>
                    )}
                    <span className="block text-sm text-ink-soft">{item.variant_label} · {item.quantity} × {money(item.unit_price_cents)}</span>
                  </span>
                  <span className="font-bold">{money(item.line_total_cents)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 grid gap-1 border-t border-dashed border-line pt-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(order.subtotal_cents)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{order.delivery_fee_cents ? money(order.delivery_fee_cents) : "Free"}</dd></div>
              {order.discount_cents > 0 && <div className="flex justify-between text-leaf"><dt>Discount ({order.promo_code})</dt><dd>−{money(order.discount_cents)}</dd></div>}
              <div className="flex justify-between pt-2 text-lg font-bold"><dt>Total (cash)</dt><dd>{money(order.total_cents)}</dd></div>
            </dl>
          </Panel>

          <Panel title="History">
            <ol className="relative grid gap-4 border-l-2 border-line pl-5">
              {(events ?? []).map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[1.72rem] top-1 size-3 rounded-full bg-leaf ring-4 ring-white" />
                  <p className="font-semibold">
                    {e.kind === "placed" && "Order placed"}
                    {e.kind === "status" && `${STATUS_INFO[e.from_value ?? ""]?.label ?? e.from_value} → ${STATUS_INFO[e.to_value ?? ""]?.label ?? e.to_value}`}
                    {e.kind === "payment" && `Payment: ${PAYMENT_INFO[e.from_value ?? ""]?.label ?? e.from_value} → ${PAYMENT_INFO[e.to_value ?? ""]?.label ?? e.to_value}`}
                  </p>
                  {e.note && <p className="text-sm text-ink-soft">“{e.note}”</p>}
                  <p className="text-xs text-ink-soft">{formatDateTime(e.created_at)}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          <Panel title="Customer">
            <p className="text-lg font-bold">{order.customer_name}</p>
            <p className="text-sm text-ink-soft">
              {previousOrders ? `Returning customer · ${previousOrders} other order${previousOrders > 1 ? "s" : ""}` : "First order"}
            </p>
            <div className="mt-3 grid gap-2">
              <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 font-semibold hover:text-leaf"><PiPhoneBold /> {order.customer_phone}</a>
              {order.customer_email && <a href={`mailto:${order.customer_email}`} className="flex items-center gap-2 font-semibold hover:text-leaf"><PiEnvelopeSimpleBold /> {order.customer_email}</a>}
            </div>
            <div className="mt-4 rounded-2xl bg-cream p-3">
              <p className="flex items-center gap-2 font-bold"><PiMapPinBold className="text-tomato" /> {order.delivery_zone_name}</p>
              <p className="mt-1 whitespace-pre-line text-sm">{order.delivery_address}</p>
              <a href={googleMapsUrl({ name: order.delivery_address, latitude: null, longitude: null, maps_query: `${order.delivery_address}, Lebanon` })} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-bold text-leaf underline">
                Find on Google Maps
              </a>
            </div>
            {order.customer_notes && (
              <p className="mt-3 rounded-2xl bg-butter/70 p-3 text-sm"><strong>Customer note:</strong> {order.customer_notes}</p>
            )}
            <Link href={`/admin/customers?q=${encodeURIComponent(order.customer_phone)}`} className="mt-3 inline-block text-sm font-bold text-leaf hover:underline">
              View customer history →
            </Link>
          </Panel>

          <Panel title="Payment · cash on delivery">
            <ActionForm action={setOrderPayment} className="flex flex-wrap gap-2">
              <input type="hidden" name="id" value={order.id} />
              {(["unpaid", "paid", "refunded"] as const).map((p) => (
                <SubmitButton
                  key={p}
                  name="payment"
                  value={p}
                  pendingText="…"
                  className={`btn btn-sm ${order.payment_status === p ? "btn-ink" : "btn-soft"}`}
                >
                  {PAYMENT_INFO[p].label}
                </SubmitButton>
              ))}
            </ActionForm>
            {order.paid_at && <p className="mt-2 text-xs text-ink-soft">Paid {formatDateTime(order.paid_at)}</p>}
          </Panel>

          <Panel title="Private notes">
            <ActionForm action={saveOrderNotes} className="grid gap-2">
              <input type="hidden" name="id" value={order.id} />
              <textarea name="admin_notes" defaultValue={order.admin_notes} className="input min-h-28" maxLength={2000} placeholder="Only admins can see this" aria-label="Private notes" />
              <SubmitButton className="btn btn-ink btn-sm justify-self-start">Save note</SubmitButton>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </div>
  );
}
