import type { Metadata } from "next";
import Link from "next/link";
import { PiMagnifyingGlassBold, PiWhatsappLogoBold } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, money } from "@/lib/format";
import { Empty, PageHeader, Pill, Table } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Customers" };
export const instant = false;

type Customer = { phone: string; name: string; email: string | null; orders: number; delivered: number; spent_cents: number; first_order: string; last_order: string; last_zone: string };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_customers", { p_search: q.replace(/[%_]/g, "") });
  const customers = (data ?? []) as Customer[];
  const vip = Math.max(...customers.map((c) => c.spent_cents), 0) * 0.5;

  return (
    <div>
      <PageHeader title="Customers" description="Everyone who ordered, grouped by phone number — no accounts needed. See who your loyal customers are." />
      <form className="relative mb-5 max-w-md" role="search">
        <PiMagnifyingGlassBold className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input name="q" defaultValue={q} placeholder="Search name or phone" className="input rounded-full pl-11" aria-label="Search customers" />
      </form>
      {customers.length === 0 ? (
        <Empty emoji="👥" title={q ? "No customers match" : "No customers yet"} />
      ) : (
        <Table>
          <thead><tr><th>Customer</th><th>Orders</th><th>Spent</th><th>Last order</th><th>Area</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.phone}>
                <td>
                  <span className="flex items-center gap-2 font-semibold">
                    {c.name}
                    {c.orders >= 3 && <Pill color="#8a5200" bg="#fef3c7">⭐ Loyal</Pill>}
                    {vip > 0 && c.spent_cents >= vip && c.orders > 1 && <Pill color="#a3245c" bg="#fde2ef">💎 Top</Pill>}
                  </span>
                  <span className="text-xs text-ink-soft">{c.phone}{c.email ? ` · ${c.email}` : ""}</span>
                </td>
                <td>{c.orders} <span className="text-xs text-ink-soft">({c.delivered} delivered)</span></td>
                <td className="font-bold">{money(c.spent_cents)}</td>
                <td>{formatDate(c.last_order)}</td>
                <td className="max-w-40 truncate">{c.last_zone}</td>
                <td>
                  <span className="flex gap-1">
                    <Link href={`/admin/orders?q=${encodeURIComponent(c.phone.replace("+", ""))}`} className="btn btn-soft btn-sm">Orders</Link>
                    <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="icon-btn text-[#128c4a]" aria-label={`WhatsApp ${c.name}`}><PiWhatsappLogoBold size={20} /></a>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
