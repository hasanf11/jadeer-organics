import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PiHandCoinsBold, PiMapPinBold, PiWhatsappLogoBold } from "react-icons/pi";
import { getStorefront } from "@/lib/catalog";
import { formatDateTime, money } from "@/lib/format";
import { CUSTOMER_STEPS, STATUS_INFO } from "@/lib/order-status";
import { hashOrderToken } from "@/lib/order-token";
import { createServiceClient } from "@/lib/supabase/service";
import OrderCelebration from "@/components/store/order-celebration";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function OrderPage({ params }: PageProps<"/order/[token]">) {
  return (
    <div className="container-x max-w-3xl pt-6 md:pt-10">
      <Suspense fallback={<div className="skeleton h-96" role="status" aria-label="Loading your order" />}>
        <OrderDetails params={params} />
      </Suspense>
    </div>
  );
}

async function OrderDetails({ params }: { params: PageProps<"/order/[token]">["params"] }) {
  const { token } = await params;
  const hash = hashOrderToken(token);
  if (!hash) notFound();

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      `order_number, status, payment_status, created_at, customer_name, customer_phone, delivery_zone_name,
       delivery_address, customer_notes, subtotal_cents, discount_cents, delivery_fee_cents, total_cents, promo_code,
       order_items (product_name, product_slug, variant_label, unit_price_cents, quantity, line_total_cents)`,
    )
    .eq("tracking_token_hash", hash)
    .maybeSingle();

  if (!order) notFound();

  const { settings } = await getStorefront();
  const whatsapp = settings.whatsapp.replace(/\D/g, "");
  const cancelled = order.status === "cancelled";
  const stepIndex = CUSTOMER_STEPS.indexOf(order.status as (typeof CUSTOMER_STEPS)[number]);
  const firstName = order.customer_name.split(/\s+/)[0];

  return (
    <>
      <Suspense fallback={null}>
        <OrderCelebration />
      </Suspense>

      <div className="rounded-[2rem] bg-leaf p-6 text-white md:p-9">
        <p className="font-bold uppercase tracking-[0.18em] text-butter">Order #{order.order_number}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold md:text-5xl">
          {cancelled ? "This order was cancelled" : `Thank you, ${firstName}! 💚`}
        </h1>
        <p className="mt-2 text-white/85">
          {cancelled
            ? "If this is a mistake, please contact us."
            : "We've received your order and will call or WhatsApp you to confirm it. Keep this page — it's your private tracking link."}
        </p>
        <p className="mt-3 text-sm text-white/70">Placed {formatDateTime(order.created_at)}</p>
      </div>

      {!cancelled && (
        <ol className="mt-6 grid grid-cols-5 gap-1" aria-label="Order progress">
          {CUSTOMER_STEPS.map((step, i) => {
            const done = i <= stepIndex;
            const info = STATUS_INFO[step];
            return (
              <li key={step} className="text-center" aria-current={i === stepIndex ? "step" : undefined}>
                <span
                  className={`mx-auto grid size-12 place-items-center rounded-full text-xl transition-colors md:size-14 ${
                    done ? "bg-leaf shadow-[0_0_0_4px_var(--color-mint)]" : "bg-white grayscale"
                  } ${i === stepIndex ? "animate-pulse" : ""}`}
                >
                  {info.emoji}
                </span>
                <span className={`mt-2 block text-[0.7rem] font-bold leading-tight md:text-sm ${done ? "text-ink" : "text-ink-soft"}`}>
                  {info.customer}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <section className="card mt-6 p-5 md:p-7" aria-labelledby="items-title">
        <h2 id="items-title" className="text-2xl">Your items</h2>
        <ul className="mt-4 divide-y divide-line">
          {order.order_items.map((item, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-3">
              <span>
                <Link href={`/products/${item.product_slug}`} className="font-bold hover:text-leaf">{item.product_name}</Link>
                <span className="block text-sm text-ink-soft">{item.variant_label} · {item.quantity} × {money(item.unit_price_cents)}</span>
              </span>
              <span className="font-bold tabular-nums">{money(item.line_total_cents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 grid gap-1.5 border-t border-dashed border-line pt-4">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(order.subtotal_cents)}</dd></div>
          <div className="flex justify-between"><dt>Delivery · {order.delivery_zone_name}</dt><dd>{order.delivery_fee_cents ? money(order.delivery_fee_cents) : "Free"}</dd></div>
          {order.discount_cents > 0 && (
            <div className="flex justify-between font-bold text-leaf"><dt>Discount {order.promo_code && `(${order.promo_code})`}</dt><dd>−{money(order.discount_cents)}</dd></div>
          )}
          <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
            <dt className="text-lg font-bold">Total to pay</dt>
            <dd className="font-display text-3xl font-extrabold">{money(order.total_cents)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card flex gap-3 p-5">
          <PiMapPinBold size={24} className="shrink-0 text-tomato" />
          <div>
            <p className="font-bold">Delivering to</p>
            <p className="text-ink-soft">{order.customer_name}</p>
            <p className="whitespace-pre-line text-ink-soft">{order.delivery_address}</p>
            <p className="text-ink-soft">{order.delivery_zone_name}</p>
          </div>
        </div>
        <div className="card flex gap-3 p-5">
          <PiHandCoinsBold size={24} className="shrink-0 text-leaf" />
          <div>
            <p className="font-bold">Cash on delivery</p>
            <p className="text-ink-soft">
              {order.payment_status === "paid" ? "Paid — thank you!" : `Please have ${money(order.total_cents)} ready for the driver.`}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello Ja'deer! About my order #${order.order_number} 🌿`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-[#25d366] text-white"
          >
            <PiWhatsappLogoBold size={20} /> Message us about this order
          </a>
        )}
        <Link href="/shop" className="btn btn-soft">Continue shopping</Link>
      </div>
    </>
  );
}
