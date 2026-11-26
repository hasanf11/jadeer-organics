import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, money } from "@/lib/format";
import { StockAdjuster } from "@/components/admin/variant-manager";
import { PageHeader, Panel, Pill } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Inventory" };
export const instant = false;

const REASONS: Record<string, string> = {
  received: " Received",
  correction: " Count corrected",
  damaged: " Damaged / used",
  order: " Ordered",
  order_cancelled: "↩️ Order cancelled",
  order_reopened: " Order reopened",
};

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireAdmin();
  const params = await searchParams;
  const filter = params.filter === "low" || params.filter === "out" ? params.filter : "";
  const supabase = await createClient();

  const [{ data: variants }, { data: settings }, { data: movements }] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id, label, price_cents, stock_quantity, is_active, products!inner(id, name, status)")
      .neq("products.status", "archived")
      .order("stock_quantity"),
    supabase.from("store_settings").select("low_stock_threshold").eq("id", 1).single(),
    supabase
      .from("stock_movements")
      .select("id, change, reason, note, created_at, product_variants(label, products(name))")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const threshold = settings?.low_stock_threshold ?? 5;
  const all = variants ?? [];
  const rows = all.filter((v) => (filter === "out" ? v.stock_quantity === 0 : filter === "low" ? v.stock_quantity <= threshold : true));
  const value = all.reduce((s, v) => s + v.stock_quantity * v.price_cents, 0);
  const outCount = all.filter((v) => v.stock_quantity === 0).length;
  const lowCount = all.filter((v) => v.stock_quantity > 0 && v.stock_quantity <= threshold).length;

  return (
    <div>
      <PageHeader title="Inventory" description="Receive deliveries, fix counts and see every stock movement. Orders take stock automatically; cancelling an order puts it back." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Sizes on sale", value: String(all.length), bg: "bg-mint" },
          { label: "Stock value (retail)", value: money(value), bg: "bg-butter" },
          { label: "Running low", value: String(lowCount), bg: "bg-[#ffe6d5]" },
          { label: "Out of stock", value: String(outCount), bg: "bg-blush" },
        ].map((k) => (
          <div key={k.label} className={`rounded-2xl p-4 ${k.bg}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{k.label}</p>
            <p className="font-display text-2xl">{k.value}</p>
          </div>
        ))}
      </div>
      <nav className="mb-4 flex gap-2" aria-label="Filter">
        {[["", "All"], ["low", "Low stock"], ["out", "Out of stock"]].map(([key, label]) => (
          <Link key={key} href={key ? `/admin/inventory?filter=${key}` : "/admin/inventory"} className={`chip border-2 px-4 py-2 text-sm ${filter === key ? "border-ink bg-ink text-cream" : "border-line bg-white"}`}>{label}</Link>
        ))}
      </nav>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ul className="grid content-start gap-2">
          {rows.map((v) => {
            const product = v.products as unknown as { id: string; name: string };
            return (
              <li key={v.id} className="grid items-center gap-3 rounded-2xl border border-line bg-white p-3 md:grid-cols-[1fr_auto_minmax(0,22rem)]">
                <span className="min-w-0">
                  <Link href={`/admin/products/${product.id}`} className="block truncate font-bold hover:text-leaf">{product.name}</Link>
                  <span className="text-sm text-ink-soft">{v.label} · {money(v.price_cents)}{!v.is_active && " · not on sale"}</span>
                </span>
                <Pill color={v.stock_quantity === 0 ? "#a91b1b" : v.stock_quantity <= threshold ? "#8a5a00" : "#23752e"} bg={v.stock_quantity === 0 ? "#fde4e4" : v.stock_quantity <= threshold ? "#fff0b8" : "#e3f4d8"}>
                  {v.stock_quantity} in stock
                </Pill>
                <StockAdjuster variantId={v.id} productId={product.id} current={v.stock_quantity} />
              </li>
            );
          })}
        </ul>
        <Panel title="Recent movements" className="content-start self-start">
          <ul className="grid gap-2 text-sm">
            {(movements ?? []).map((m) => {
              const variant = m.product_variants as unknown as { label: string; products: { name: string } } | null;
              return (
                <li key={m.id} className="flex items-start justify-between gap-2 border-b border-line pb-2 last:border-0">
                  <span>
                    <span className="block font-semibold">{variant?.products.name} · {variant?.label}</span>
                    <span className="text-xs text-ink-soft">{REASONS[m.reason] ?? m.reason} · {formatDateTime(m.created_at)}{m.note ? ` · ${m.note}` : ""}</span>
                  </span>
                  <span className={`font-bold ${m.change > 0 ? "text-leaf" : "text-tomato"}`}>{m.change > 0 ? `+${m.change}` : m.change}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
