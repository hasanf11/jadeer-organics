import type { Metadata } from "next";
import { PiWhatsappLogoBold } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { markAlertNotified } from "@/lib/admin-actions/care";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import { Empty, PageHeader, Pill } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Stock alerts" };
export const instant = false;

type Alert = { id: string; name: string; phone: string; created_at: string; product_variants: { label: string; stock_quantity: number; products: { name: string; slug: string } } };

export default async function StockAlertsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_alerts")
    .select("id, name, phone, created_at, product_variants!inner(label, stock_quantity, products!inner(name, slug))")
    .is("notified_at", null)
    .order("created_at");
  const alerts = (data ?? []) as unknown as Alert[];
  const ready = alerts.filter((a) => a.product_variants.stock_quantity > 0);
  const waiting = alerts.filter((a) => a.product_variants.stock_quantity <= 0);
  const base = siteUrl() ?? "";

  const row = (a: Alert, isReady: boolean) => {
    const v = a.product_variants;
    const text = `Hi ${a.name.split(" ")[0] || "there"}, this is Ja'deer Organics 🌿 Good news: ${v.products.name} (${v.label}) is back in stock! ${base ? `${base}/products/${v.products.slug}` : ""}`;
    return (
      <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4">
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{v.products.name} · {v.label}</span>
          <span className="text-sm text-ink-soft">{a.name || "Customer"} · {a.phone} · asked {formatDateTime(a.created_at)}</span>
        </span>
        {isReady ? <Pill color="#23752e" bg="#e3f4d8">{v.stock_quantity} back in stock</Pill> : <Pill color="#a91b1b" bg="#fde4e4">Still sold out</Pill>}
        {isReady && (
          <a href={`https://wa.me/${a.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-[#25d366] text-white">
            <PiWhatsappLogoBold /> Tell them
          </a>
        )}
        <ActionForm action={markAlertNotified} className="flex gap-2">
          <input type="hidden" name="id" value={a.id} />
          {isReady && <SubmitButton name="intent" value="done" className="btn btn-ink btn-sm" pendingText="…">✓ Done</SubmitButton>}
          <SubmitButton name="intent" value="delete" className="btn btn-soft btn-sm text-tomato" pendingText="…">Remove</SubmitButton>
        </ActionForm>
      </li>
    );
  };

  return (
    <div>
      <PageHeader title="Stock alerts" description="Customers who asked to be told when a sold-out size is back. Restock it, then message them in one tap." />
      {alerts.length === 0 ? (
        <Empty emoji="🔔" title="No one is waiting" text="When a size sells out, customers can leave their number on the product page." />
      ) : (
        <div className="grid gap-6">
          {ready.length > 0 && <section><h2 className="mb-3 font-display text-xl font-extrabold">✅ Ready to message ({ready.length})</h2><ul className="grid gap-2">{ready.map((a) => row(a, true))}</ul></section>}
          {waiting.length > 0 && <section><h2 className="mb-3 font-display text-xl font-extrabold">⏳ Waiting for stock ({waiting.length})</h2><ul className="grid gap-2">{waiting.map((a) => row(a, false))}</ul></section>}
        </div>
      )}
    </div>
  );
}
