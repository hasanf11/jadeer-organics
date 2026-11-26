import type { Metadata } from "next";
import Link from "next/link";
import { PiDownloadSimpleBold, PiMagnifyingGlassBold, PiWhatsappLogoBold } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, money } from "@/lib/format";
import { ORDER_STATUSES, PAYMENT_INFO, STATUS_INFO } from "@/lib/order-status";
import { Empty, PageHeader, Pill, Table } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Orders" };
export const instant = false;

const PAGE_SIZE = 40;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const params = await searchParams;
  const status = typeof params.status === "string" && ORDER_STATUSES.includes(params.status as never) ? params.status : "";
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, delivery_zone_name, total_cents, status, payment_status, created_at, order_items(quantity)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);
  if (q) {
    const safe = q.replace(/[%,()*]/g, " ");
    query = /^\d+$/.test(safe)
      ? query.or(`order_number.eq.${safe},customer_phone.ilike.%${safe}%`)
      : query.or(`customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%`);
  }

  const [{ data: orders, count }, statusRows] = await Promise.all([
    query,
    Promise.all(ORDER_STATUSES.map((s) => supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", s))),
  ]);
  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s, i) => [s, statusRows[i].count ?? 0]));
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const link = (changes: Record<string, string | number | null>) => {
    const next = new URLSearchParams();
    const merged = { status, q, page: "", ...changes };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, String(v));
    const qs = next.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Confirm new orders, follow them to the door and message customers on WhatsApp in one tap."
        actions={
          <a href={`/admin/orders/export${status ? `?status=${status}` : ""}`} className="btn btn-soft btn-sm">
            <PiDownloadSimpleBold /> Export to Excel
          </a>
        }
      />

      <nav aria-label="Order status" className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <Link href={link({ status: null })} className={`chip shrink-0 border-2 px-4 py-2 text-sm ${!status ? "border-ink bg-ink text-cream" : "border-line bg-white"}`}>
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={link({ status: s })}
            aria-current={status === s ? "true" : undefined}
            className={`chip shrink-0 border-2 px-4 py-2 text-sm ${status === s ? "border-ink bg-ink text-cream" : "border-line bg-white"}`}
          >
            {STATUS_INFO[s].label}
            <span className="rounded-full bg-cream px-1.5 text-ink">{statusCounts[s]}</span>
          </Link>
        ))}
      </nav>

      <form className="relative mb-5 max-w-md" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <PiMagnifyingGlassBold className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input name="q" defaultValue={q} placeholder="Search name, phone or order number" className="input rounded-full pl-11" aria-label="Search orders" />
      </form>

      {!orders?.length ? (
        <Empty title={q || status ? "No orders match" : "No orders yet"} text={q || status ? "Try another search or status." : "New orders will appear here instantly."} />
      ) : (
        <>
          {/* Phones: cards */}
          <ul className="grid gap-3 md:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="block rounded-2xl border border-line bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">#{o.order_number} · {o.customer_name}</span>
                    <span className="font-bold">{money(o.total_cents)}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{o.delivery_zone_name} · {formatDateTime(o.created_at)}</p>
                  <div className="mt-2 flex gap-1.5">
                    <Pill color={STATUS_INFO[o.status].color} bg={STATUS_INFO[o.status].bg}>{STATUS_INFO[o.status].label}</Pill>
                    <Pill color={PAYMENT_INFO[o.payment_status].color} bg={PAYMENT_INFO[o.payment_status].bg}>{PAYMENT_INFO[o.payment_status].label}</Pill>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Table>
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Area</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th><span className="sr-only">WhatsApp</span></th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="font-bold text-leaf hover:underline">#{o.order_number}</Link>
                      <span className="block text-xs text-ink-soft">{formatDateTime(o.created_at)}</span>
                    </td>
                    <td>
                      <span className="block font-semibold">{o.customer_name}</span>
                      <span className="text-xs text-ink-soft">{o.customer_phone}</span>
                    </td>
                    <td className="max-w-40 truncate">{o.delivery_zone_name}</td>
                    <td>{o.order_items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="font-bold">{money(o.total_cents)}</td>
                    <td><Pill color={STATUS_INFO[o.status].color} bg={STATUS_INFO[o.status].bg}>{STATUS_INFO[o.status].label}</Pill></td>
                    <td><Pill color={PAYMENT_INFO[o.payment_status].color} bg={PAYMENT_INFO[o.payment_status].bg}>{PAYMENT_INFO[o.payment_status].label}</Pill></td>
                    <td>
                      <a href={`https://wa.me/${o.customer_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="icon-btn text-[#128c4a]" aria-label={`WhatsApp ${o.customer_name}`}>
                        <PiWhatsappLogoBold size={20} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {pages > 1 && (
            <nav aria-label="Pages" className="mt-5 flex items-center justify-center gap-2">
              {page > 1 && <Link href={link({ page: page - 1 })} className="btn btn-soft btn-sm">← Newer</Link>}
              <span className="text-sm font-semibold text-ink-soft">Page {page} of {pages}</span>
              {page < pages && <Link href={link({ page: page + 1 })} className="btn btn-soft btn-sm">Older →</Link>}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
