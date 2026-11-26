import type { Metadata } from "next";
import Link from "next/link";
import {
  PiArrowRightBold,
  PiBellRingingBold,
  PiChatCircleDotsBold,
  PiCurrencyDollarBold,
  PiPackageBold,
  PiReceiptBold,
  PiStarBold,
  PiTrendUpBold,
  PiUsersBold,
  PiWarningCircleBold,
} from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { money, timeAgo } from "@/lib/format";
import { STATUS_INFO } from "@/lib/order-status";
import { Panel, Pill } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Dashboard" };
export const instant = false;

type Overview = {
  days: number;
  revenue: number;
  orders: number;
  items: number;
  average: number;
  collected: number;
  customers: number;
  cancelled: number;
  daily: { day: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  zones: { zone: string; orders: number }[];
  statusCounts: Record<string, number>;
};

const PERIODS = [7, 30, 90];

function dayLabel(day: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const days = PERIODS.includes(Number(params.days)) ? Number(params.days) : 30;
  const supabase = await createClient();

  const [{ data: overviewData, error }, recent, variants, settings, counts] = await Promise.all([
    supabase.rpc("admin_sales_overview", { p_days: days }),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, total_cents, status, created_at, delivery_zone_name")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("product_variants")
      .select("id, label, stock_quantity, products!inner(id, name, status)")
      .eq("is_active", true)
      .eq("products.status", "published")
      .order("stock_quantity")
      .limit(8),
    supabase.from("store_settings").select("low_stock_threshold").eq("id", 1).single(),
    Promise.all([
      supabase.from("contact_messages").select("id", { count: "exact", head: true }).is("handled_at", null),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("stock_alerts").select("id", { count: "exact", head: true }).is("notified_at", null),
    ]),
  ]);

  const overview = (error ? null : overviewData) as Overview | null;
  const threshold = settings.data?.low_stock_threshold ?? 5;
  const lowStock = (variants.data ?? []).filter((v) => v.stock_quantity <= threshold);
  const [messages, reviews, alerts] = counts.map((c) => c.count ?? 0);
  const pending = overview?.statusCounts.pending ?? 0;
  const maxRevenue = Math.max(1, ...(overview?.daily.map((d) => d.revenue) ?? [1]));
  const maxZone = Math.max(1, ...(overview?.zones.map((z) => z.orders) ?? [1]));

  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Beirut" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const attention = [
    { href: "/admin/orders?status=pending", label: "New orders to confirm", count: pending, icon: PiReceiptBold, bg: "bg-butter", color: "text-[#8a5a00]" },
    { href: "/admin/messages", label: "Unread messages", count: messages, icon: PiChatCircleDotsBold, bg: "bg-sky", color: "text-[#0b5f7a]" },
    { href: "/admin/reviews", label: "Reviews to approve", count: reviews, icon: PiStarBold, bg: "bg-blush", color: "text-berry" },
    { href: "/admin/stock-alerts", label: "Customers waiting for stock", count: alerts, icon: PiBellRingingBold, bg: "bg-mint", color: "text-leaf-dark" },
  ];

  const kpis = overview
    ? [
        { label: "Revenue", value: money(overview.revenue), icon: PiCurrencyDollarBold, bg: "bg-leaf", fg: "text-white" },
        { label: "Orders", value: String(overview.orders), icon: PiReceiptBold, bg: "bg-tomato", fg: "text-white" },
        { label: "Average order", value: money(overview.average), icon: PiTrendUpBold, bg: "bg-sun", fg: "text-ink" },
        { label: "Customers", value: String(overview.customers), icon: PiUsersBold, bg: "bg-berry", fg: "text-white" },
        { label: "Items sold", value: String(overview.items), icon: PiPackageBold, bg: "bg-teal", fg: "text-white" },
        { label: "Cash collected", value: money(overview.collected), icon: PiCurrencyDollarBold, bg: "bg-brown", fg: "text-cream" },
      ]
    : [];

  return (
    <div className="grid min-w-0 gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your shop today</p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">
            {greeting}, {admin.displayName}
          </h1>
        </div>
        <nav aria-label="Period" className="flex rounded-full bg-white p-1 shadow-soft">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin?days=${p}`}
              aria-current={p === days ? "true" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-bold ${p === days ? "bg-ink text-cream" : "text-ink-soft hover:text-ink"}`}
            >
              {p} days
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {attention.map(({ href, label, count, icon: Icon, bg, color }) => (
          <Link key={href} href={href} className={`group flex items-center gap-3 rounded-2xl p-4 transition-transform hover:-translate-y-0.5 ${bg}`}>
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-white ${color}`}>
              <Icon size={22} />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-2xl leading-none">{count}</span>
              <span className="block text-xs font-semibold leading-tight text-ink-soft">{label}</span>
            </span>
          </Link>
        ))}
      </div>

      {!overview ? (
        <p className="rounded-2xl bg-tomato/10 p-4 font-bold text-tomato">Sales figures could not be loaded. Refresh to try again.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {kpis.map(({ label, value, icon: Icon, bg, fg }) => (
              <div key={label} className={`relative overflow-hidden rounded-2xl p-4 ${bg} ${fg}`}>
                <Icon size={56} className="absolute -bottom-2 -right-2 opacity-15" aria-hidden="true" />
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
                <p className="mt-1 truncate font-display text-2xl">{value}</p>
                <p className="text-xs opacity-75">Last {days} days</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <Panel title="Daily sales">
              <div className="overflow-x-auto">
                <div className="flex h-56 min-w-full items-end gap-1" style={{ minWidth: `${overview.daily.length * (days > 30 ? 10 : 22)}px` }} role="img" aria-label={`Daily revenue for the last ${days} days`}>
                  {overview.daily.map((d) => (
                    <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-leaf to-lime transition-opacity group-hover:opacity-80"
                        style={{ height: `${Math.max(d.revenue ? 4 : 1, (d.revenue / maxRevenue) * 100)}%` }}
                      />
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-bold text-cream group-hover:block">
                        {dayLabel(d.day)} · {money(d.revenue)} · {d.orders} orders
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs font-semibold text-ink-soft">
                <span>{overview.daily[0] && dayLabel(overview.daily[0].day)}</span>
                <span>Today</span>
              </div>
            </Panel>

            <Panel title="Best sellers">
              {overview.topProducts.length === 0 ? (
                <p className="text-ink-soft">No sales in this period yet.</p>
              ) : (
                <ol className="grid gap-2">
                  {overview.topProducts.map((p, i) => (
                    <li key={p.name} className="flex items-center gap-3">
                      <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${["bg-sun", "bg-line", "bg-[#f3c9a3]"][i] ?? "bg-cream"}`}>{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                      <span className="text-sm text-ink-soft">{p.quantity} sold</span>
                      <span className="w-20 text-right font-bold">{money(p.revenue)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel
              title="Latest orders"
              className="lg:col-span-2"
              actions={<Link href="/admin/orders" className="text-sm font-bold text-leaf hover:underline">All orders →</Link>}
            >
              {(recent.data ?? []).length === 0 ? (
                <p className="text-ink-soft">No orders yet. Share your shop link on Instagram!</p>
              ) : (
                <ul className="divide-y divide-line">
                  {(recent.data ?? []).map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-3 hover:bg-cream/50">
                        <span className="font-mono text-sm font-bold text-ink-soft">#{o.order_number}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{o.customer_name}</span>
                          <span className="text-xs text-ink-soft">{o.delivery_zone_name} · {timeAgo(o.created_at)}</span>
                        </span>
                        <Pill color={STATUS_INFO[o.status].color} bg={STATUS_INFO[o.status].bg}>{STATUS_INFO[o.status].label}</Pill>
                        <span className="hidden w-20 text-right font-bold sm:block">{money(o.total_cents)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Orders by area">
              {overview.zones.length === 0 ? (
                <p className="text-ink-soft">No orders in this period yet.</p>
              ) : (
                <ul className="grid gap-3">
                  {overview.zones.map((z) => (
                    <li key={z.zone}>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="truncate">{z.zone}</span>
                        <span>{z.orders}</span>
                      </div>
                      <div className="mt-1 h-2.5 rounded-full bg-cream">
                        <div className="h-full rounded-full bg-tomato" style={{ width: `${(z.orders / maxZone) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}

      <Panel
        title={<span className="flex items-center gap-2"><PiWarningCircleBold className="text-orange" /> Running low</span>}
        actions={<Link href="/admin/inventory" className="text-sm font-bold text-leaf hover:underline">Inventory →</Link>}
      >
        {lowStock.length === 0 ? (
          <p className="text-ink-soft">Everything is well stocked</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {lowStock.map((v) => {
              const product = v.products as unknown as { id: string; name: string };
              return (
                <li key={v.id}>
                  <Link href={`/admin/products/${product.id}`} className={`flex items-center justify-between gap-2 rounded-2xl p-3 ${v.stock_quantity === 0 ? "bg-tomato/10" : "bg-butter/60"}`}>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{product.name}</span>
                      <span className="text-xs text-ink-soft">{v.label}</span>
                    </span>
                    <span className={`font-display text-xl ${v.stock_quantity === 0 ? "text-tomato" : ""}`}>{v.stock_quantity}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Link href="/admin/products/new" className="btn btn-primary justify-self-start">
        Add a new product <PiArrowRightBold />
      </Link>
    </div>
  );
}
