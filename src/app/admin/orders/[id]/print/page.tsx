import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, money } from "@/lib/format";
import PrintButton from "@/components/admin/print-button";

export const metadata: Metadata = { title: "Invoice" };
export const instant = false;

export default async function PrintOrderPage({ params }: PageProps<"/admin/orders/[id]/print">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: order }, { data: settings }] = await Promise.all([
    supabase.from("orders").select("*, order_items(id, product_name, variant_label, unit_price_cents, quantity, line_total_cents)").eq("id", id).maybeSingle(),
    supabase.from("store_settings").select("phone, whatsapp, email").eq("id", 1).single(),
  ]);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 print:max-w-none print:rounded-none print:p-0">
      <div className="no-print mb-6 flex justify-end"><PrintButton /></div>
      <header className="flex items-start justify-between gap-4 border-b-2 border-ink pb-5">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo-source.png" alt="" width={64} height={64} className="rounded-full" />
          <div>
            <p className="font-display text-2xl font-extrabold">Ja&apos;deer Organics</p>
            <p className="text-sm text-ink-soft">{[settings?.phone || settings?.whatsapp, settings?.email].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-extrabold">Order #{order.order_number}</p>
          <p className="text-sm text-ink-soft">{formatDateTime(order.created_at)}</p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-6 py-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Deliver to</p>
          <p className="font-bold">{order.customer_name}</p>
          <p>{order.customer_phone}</p>
          <p className="whitespace-pre-line">{order.delivery_address}</p>
          <p>{order.delivery_zone_name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Payment</p>
          <p className="font-bold">Cash on delivery</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-ink-soft">Amount to collect</p>
          <p className="font-display text-3xl font-extrabold">{order.payment_status === "paid" ? "PAID" : money(order.total_cents)}</p>
        </div>
      </section>
      <table className="w-full text-left text-sm">
        <thead className="border-y border-ink"><tr><th className="py-2">Item</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">Total</th></tr></thead>
        <tbody>
          {order.order_items.map((item: { id: string; product_name: string; variant_label: string; unit_price_cents: number; quantity: number; line_total_cents: number }) => (
            <tr key={item.id} className="border-b border-line">
              <td className="py-2">{item.product_name} <span className="text-ink-soft">({item.variant_label})</span></td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-right">{money(item.unit_price_cents)}</td>
              <td className="py-2 text-right">{money(item.line_total_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto mt-4 grid max-w-xs gap-1 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(order.subtotal_cents)}</dd></div>
        <div className="flex justify-between"><dt>Delivery</dt><dd>{money(order.delivery_fee_cents)}</dd></div>
        {order.discount_cents > 0 && <div className="flex justify-between"><dt>Discount {order.promo_code}</dt><dd>−{money(order.discount_cents)}</dd></div>}
        <div className="flex justify-between border-t border-ink pt-1 text-base font-bold"><dt>Total</dt><dd>{money(order.total_cents)}</dd></div>
      </dl>
      {order.customer_notes && <p className="mt-6 rounded-xl bg-cream p-3 text-sm"><strong>Note:</strong> {order.customer_notes}</p>}
      <p className="mt-10 text-center text-sm text-ink-soft">Thank you for choosing Ja&apos;deer Organics 💚 You deserve this way of life.</p>
    </div>
  );
}
