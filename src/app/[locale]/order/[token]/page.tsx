import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PiHandCoinsBold, PiMapPinBold, PiWhatsappLogoBold } from "react-icons/pi";
import { getStorefront } from "@/lib/catalog";
import { formatDateTime, money } from "@/lib/format";
import { localizeLabel } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { CUSTOMER_STEPS } from "@/lib/order-status";
import { hashOrderToken } from "@/lib/order-token";
import { createServiceClient } from "@/lib/supabase/service";
import StatusIcon from "@/components/status-icon";
import OrderSaver from "@/components/store/order-saver";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.order.metaTitle, robots: { index: false, follow: false }, referrer: "no-referrer" };
}

export default function OrderPage({ params }: PageProps<"/[locale]/order/[token]">) {
  return (
    <div className="container-x max-w-3xl pt-6 md:pt-10">
      <Suspense fallback={<div className="skeleton h-96" role="status" />}>
        <OrderDetails params={params} />
      </Suspense>
    </div>
  );
}

async function OrderDetails({ params }: { params: PageProps<"/[locale]/order/[token]">["params"] }) {
  const { token } = await params;
  const hash = hashOrderToken(token);
  if (!hash) notFound();

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      `order_number, status, payment_status, created_at, customer_name, delivery_zone_id, delivery_zone_name, delivery_address,
       subtotal_cents, discount_cents, delivery_fee_cents, total_cents, promo_code,
       order_items (product_name, product_slug, variant_label, unit_price_cents, quantity, line_total_cents)`,
    )
    .eq("tracking_token_hash", hash)
    .maybeSingle();
  if (!order) notFound();

  const { t, href, locale } = await getI18n();
  const { settings, products, zones } = await getStorefront();
  const whatsapp = settings.whatsapp.replace(/\D/g, "");
  const cancelled = order.status === "cancelled";
  const stepIndex = CUSTOMER_STEPS.indexOf(order.status as (typeof CUSTOMER_STEPS)[number]);
  const firstName = order.customer_name.split(/\s+/)[0];
  const nameFor = (slug: string, fallback: string) => products.find((p) => p.slug === slug)?.name ?? fallback;
  const zoneName = zones.find((z) => z.id === order.delivery_zone_id)?.name ?? order.delivery_zone_name;
  const greeting = locale === "ar" ? `مرحباً جدير، بخصوص طلبي رقم ${order.order_number}.` : `Hello Ja'deer, I have a question about my order #${order.order_number}.`;

  return (
    <>
      <OrderSaver number={order.order_number} token={token} total={order.total_cents} date={order.created_at} />

      <div className="grain relative overflow-hidden rounded-[2rem] bg-leaf p-7 text-cream md:p-10">
        <div aria-hidden="true" className="absolute -end-16 -top-16 size-56 rounded-full bg-sun/30 blur-2xl" />
        {!cancelled && (
          <svg viewBox="0 0 52 52" className="relative mb-5 size-14" aria-hidden="true">
            <circle cx="26" cy="26" r="24" fill="none" stroke="#f3b43c" strokeWidth="3" className="[stroke-dasharray:151] [stroke-dashoffset:151] motion-safe:animate-[draw_0.8s_ease-out_forwards] motion-reduce:[stroke-dashoffset:0]" />
            <path d="M15 27l7 7 15-15" fill="none" stroke="#fbf6ec" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="[stroke-dasharray:40] [stroke-dashoffset:40] motion-safe:animate-[draw_0.5s_0.6s_ease-out_forwards] motion-reduce:[stroke-dashoffset:0]" />
          </svg>
        )}
        <p className="relative text-sm font-bold text-sun">{t.order.number(order.order_number)}</p>
        <h1 className="relative mt-2 font-display text-4xl md:text-5xl">{cancelled ? t.order.cancelledTitle : t.order.thanks(firstName)}</h1>
        <p className="relative mt-3 text-cream/85">{cancelled ? t.order.cancelledText : t.order.receivedText}</p>
        <p className="relative mt-3 text-sm text-cream/65">{t.order.placed(formatDateTime(order.created_at, locale))}</p>
      </div>

      {!cancelled && (
        <ol className="mt-6 grid grid-cols-5 gap-1" aria-label={t.order.progress}>
          {CUSTOMER_STEPS.map((step, i) => {
            const done = i <= stepIndex;
            return (
              <li key={step} className="relative text-center" aria-current={i === stepIndex ? "step" : undefined}>
                <span className={`mx-auto grid size-11 place-items-center rounded-full transition-colors md:size-12 ${done ? "bg-leaf text-white" : "bg-paper text-ink-soft shadow-[inset_0_0_0_1.5px_var(--color-line)]"} ${i === stepIndex ? "ring-4 ring-sun/50" : ""}`}>
                  <StatusIcon status={step} />
                </span>
                <span className={`mt-2 block text-[0.68rem] font-bold leading-tight md:text-sm ${done ? "text-ink" : "text-ink-soft"}`}>{t.status[step]}</span>
              </li>
            );
          })}
        </ol>
      )}

      <section className="mt-6 rounded-3xl bg-paper p-5 shadow-soft md:p-7" aria-labelledby="items-title">
        <h2 id="items-title" className="text-2xl">{t.order.items}</h2>
        <ul className="mt-4 divide-y divide-line">
          {order.order_items.map((item, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-3">
              <span>
                <Link href={href(`/products/${item.product_slug}`)} className="font-bold hover:text-tomato">{nameFor(item.product_slug, item.product_name)}</Link>
                <span className="block text-sm text-ink-soft">{localizeLabel(item.variant_label, locale)} · {item.quantity} × {money(item.unit_price_cents)}</span>
              </span>
              <span className="font-bold tabular-nums">{money(item.line_total_cents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 grid gap-1.5 border-t border-dashed border-line pt-4">
          <div className="flex justify-between"><dt>{t.common.subtotal}</dt><dd>{money(order.subtotal_cents)}</dd></div>
          <div className="flex justify-between"><dt>{t.common.delivery}</dt><dd>{order.delivery_fee_cents ? money(order.delivery_fee_cents) : t.common.free}</dd></div>
          {order.discount_cents > 0 && <div className="flex justify-between font-bold text-leaf"><dt>{t.common.discount} {order.promo_code && <span dir="ltr">({order.promo_code})</span>}</dt><dd>−{money(order.discount_cents)}</dd></div>}
          <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
            <dt className="text-lg font-bold">{t.order.totalToPay}</dt>
            <dd className="font-display text-3xl">{money(order.total_cents)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="flex gap-3 rounded-3xl bg-mint p-5">
          <PiMapPinBold size={24} className="shrink-0 text-leaf" aria-hidden="true" />
          <div>
            <p className="font-bold">{t.order.deliveringTo}</p>
            <p className="text-ink-soft">{order.customer_name}</p>
            <p className="whitespace-pre-line text-ink-soft">{order.delivery_address}</p>
            <p className="text-ink-soft">{zoneName}</p>
          </div>
        </div>
        <div className="flex gap-3 rounded-3xl bg-butter p-5">
          <PiHandCoinsBold size={24} className="shrink-0 text-tomato" aria-hidden="true" />
          <div>
            <p className="font-bold">{t.common.cod}</p>
            <p className="text-ink-soft">{order.payment_status === "paid" ? t.order.paid : t.order.haveReady(money(order.total_cents))}</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm font-bold text-leaf">{t.order.savedToDevice}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(greeting)}`} target="_blank" rel="noopener noreferrer" className="btn bg-[#25d366] text-white hover:bg-[#1fb257]">
            <PiWhatsappLogoBold size={20} aria-hidden="true" /> {t.order.messageUs}
          </a>
        )}
        <Link href={href("/shop")} className="btn btn-soft">{t.order.continueShopping}</Link>
      </div>
    </>
  );
}
