import type { Metadata } from "next";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, money } from "@/lib/format";
import { ORDER_STATUSES, STATUS_INFO } from "@/lib/order-status";
import PrintButton from "@/components/admin/print-button";

export const metadata: Metadata = { title: "Delivery slips" };
export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Slip = {
  id: string;
  order_number: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  delivery_zone_name: string;
  delivery_address: string;
  customer_notes: string;
  total_cents: number;
  payment_status: string;
  order_items: { product_name: string; variant_label: string; quantity: number }[];
};

/** Delivery slips for several orders, two per printed page. */
export default async function PrintSlipsPage({ searchParams }: PageProps<"/admin/orders/print-slips">) {
  await requireAdmin();
  const params = await searchParams;
  const ids = typeof params.ids === "string" ? params.ids.split(",").filter((v) => UUID.test(v)).slice(0, 100) : [];
  const status = typeof params.status === "string" && ORDER_STATUSES.includes(params.status as never) ? params.status : "confirmed";

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, created_at, customer_name, customer_phone, delivery_zone_name, delivery_address, customer_notes, total_cents, payment_status, order_items(product_name, variant_label, quantity)")
    .order("created_at")
    .limit(100);
  query = ids.length ? query.in("id", ids) : query.eq("status", status);
  const { data } = await query;
  const slips = (data ?? []) as Slip[];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-bold">
          {slips.length} slip{slips.length === 1 ? "" : "s"} {ids.length ? "(selected orders)" : `· ${STATUS_INFO[status].label} orders`}
        </p>
        <PrintButton />
      </div>
      {slips.length === 0 && <p className="text-ink-soft">No orders to print.</p>}
      <div className="grid gap-6 print:block">
        {slips.map((slip) => (
          <section key={slip.id} className="break-inside-avoid rounded-2xl border-2 border-dashed border-ink/40 bg-white p-6 print:mb-6 print:rounded-none">
            <header className="flex items-start justify-between gap-4 border-b border-line pb-3">
              <div className="flex items-center gap-3">
                <Image src="/brand/logo-source.png" alt="" width={44} height={44} className="rounded-full" />
                <div>
                  <p className="font-display text-xl">Order #{slip.order_number}</p>
                  <p className="text-xs text-ink-soft">{formatDateTime(slip.created_at)}</p>
                </div>
              </div>
              <div className="text-end">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Collect (cash)</p>
                <p className="font-display text-3xl">{slip.payment_status === "paid" ? "PAID" : money(slip.total_cents)}</p>
              </div>
            </header>
            <div className="grid gap-4 pt-3 sm:grid-cols-2">
              <div>
                <p className="text-lg font-bold">{slip.customer_name}</p>
                <p className="font-bold" dir="ltr">{slip.customer_phone}</p>
                <p className="mt-1 whitespace-pre-line">{slip.delivery_address}</p>
                <p className="text-ink-soft">{slip.delivery_zone_name}</p>
                {slip.customer_notes && <p className="mt-2 rounded-lg bg-butter p-2 text-sm"><strong>Note:</strong> {slip.customer_notes}</p>}
              </div>
              <ul className="text-sm">
                {slip.order_items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-2 border-b border-line py-1">
                    <span>{item.product_name} <span className="text-ink-soft">({item.variant_label})</span></span>
                    <span className="font-bold">× {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
