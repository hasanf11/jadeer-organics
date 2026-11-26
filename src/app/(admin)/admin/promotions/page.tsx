import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { currentTime, dollarsInput, formatDate } from "@/lib/format";
import { describePromo } from "@/lib/pricing";
import { deletePromotion, savePromotion } from "@/lib/admin-actions/setup";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import DeleteButton from "@/components/admin/delete-button";
import { PageHeader, Pill } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Promo codes" };
export const instant = false;

type Promo = { id: string; code: string; description: string; kind: "percent" | "fixed" | "free_delivery"; value: number; min_order_cents: number; max_uses: number | null; uses_count: number; starts_at: string | null; ends_at: string | null; is_active: boolean };

const day = (v: string | null) => (v ? new Date(v).toLocaleDateString("en-CA", { timeZone: "Asia/Beirut" }) : "");

function Fields({ p }: { p?: Promo }) {
  return (
    <>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="field"><span className="field-label">Code</span><input name="code" defaultValue={p?.code} className="input uppercase" required maxLength={30} placeholder="RAMADAN15" /></label>
        <label className="field"><span className="field-label">Type</span>
          <select name="kind" defaultValue={p?.kind ?? "percent"} className="input">
            <option value="percent">% off</option>
            <option value="fixed">$ off</option>
            <option value="free_delivery">Free delivery</option>
          </select>
        </label>
        <label className="field"><span className="field-label">Amount (% or $)</span><input name="value" defaultValue={p ? (p.kind === "fixed" ? dollarsInput(p.value) : p.kind === "percent" ? p.value : "") : ""} className="input" inputMode="decimal" placeholder="10" /></label>
        <label className="field"><span className="field-label">Minimum order $</span><input name="min_order" defaultValue={p ? dollarsInput(p.min_order_cents) : ""} className="input" inputMode="decimal" placeholder="0" /></label>
        <label className="field"><span className="field-label">Starts</span><input type="date" name="starts_at" defaultValue={day(p?.starts_at ?? null)} className="input" /></label>
        <label className="field"><span className="field-label">Ends</span><input type="date" name="ends_at" defaultValue={day(p?.ends_at ?? null)} className="input" /></label>
        <label className="field"><span className="field-label">Max uses</span><input type="number" min={0} name="max_uses" defaultValue={p?.max_uses ?? ""} className="input" placeholder="Unlimited" /></label>
        <label className="flex items-center gap-2 pt-6 font-semibold"><input type="checkbox" name="is_active" defaultChecked={p?.is_active ?? true} className="size-5 accent-[var(--color-leaf)]" /> Active</label>
      </div>
      <label className="field"><span className="field-label">Note (for you)</span><input name="description" defaultValue={p?.description} className="input" maxLength={200} /></label>
    </>
  );
}

export default async function PromotionsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
  const now = currentTime();

  return (
    <div>
      <PageHeader title="Promo codes" description="Create codes to share on Instagram. Customers type them at checkout; discounts are checked by the server." />
      <div className="grid gap-4 xl:grid-cols-2">
        {((data ?? []) as Promo[]).map((p) => {
          const expired = p.ends_at && new Date(p.ends_at).getTime() < now;
          const used = p.max_uses != null && p.uses_count >= p.max_uses;
          const live = p.is_active && !expired && !used;
          return (
            <details key={p.id} className="group rounded-3xl border border-line bg-white">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                <span className="rounded-xl border-2 border-dashed border-tomato bg-[#fff1e3] px-3 py-1.5 font-mono text-lg font-bold text-tomato">{p.code}</span>
                <span className="flex-1">
                  <span className="block font-bold">{describePromo(p)}{p.min_order_cents ? ` · min $${(p.min_order_cents / 100).toFixed(0)}` : ""}</span>
                  <span className="text-sm text-ink-soft">Used {p.uses_count}{p.max_uses ? ` / ${p.max_uses}` : ""} time{p.uses_count === 1 && !p.max_uses ? "" : "s"}{p.ends_at ? ` · until ${formatDate(p.ends_at)}` : ""}</span>
                </span>
                <Pill color={live ? "#23752e" : "#5b4a43"} bg={live ? "#e3f4d8" : "#efe6da"}>{live ? "Live" : expired ? "Expired" : used ? "Used up" : "Off"}</Pill>
              </summary>
              <div className="border-t border-line p-4">
                <ActionForm action={savePromotion} className="grid gap-3"><Fields p={p} /><SubmitButton className="btn btn-primary btn-sm justify-self-start">Save</SubmitButton></ActionForm>
                <div className="mt-2 flex justify-end"><DeleteButton action={deletePromotion} id={p.id} confirm={`Delete ${p.code}?`} /></div>
              </div>
            </details>
          );
        })}
      </div>
      <section className="mt-6 rounded-3xl border-2 border-dashed border-leaf/40 bg-mint/30 p-5">
        <h2 className="mb-3 font-display text-xl">New promo code</h2>
        <ActionForm action={savePromotion} className="grid gap-3" resetOnSuccess><Fields /><SubmitButton className="btn btn-primary justify-self-start">Create code</SubmitButton></ActionForm>
      </section>
    </div>
  );
}
