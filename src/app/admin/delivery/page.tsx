import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsInput } from "@/lib/format";
import { deleteZone, saveZone } from "@/lib/admin-actions/setup";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import DeleteButton from "@/components/admin/delete-button";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Delivery areas" };
export const instant = false;

type Zone = { id: string; name: string; fee_cents: number; eta: string; is_active: boolean; sort_order: number };

function ZoneFields({ z }: { z?: Zone }) {
  return (
    <>
      {z && <input type="hidden" name="id" value={z.id} />}
      <label className="field"><span className="field-label">Area</span><input name="name" defaultValue={z?.name} className="input" required maxLength={80} /></label>
      <label className="field"><span className="field-label">Fee $</span><input name="fee" defaultValue={z ? dollarsInput(z.fee_cents) : ""} className="input" inputMode="decimal" required placeholder="3" /></label>
      <label className="field"><span className="field-label">Delivery time</span><input name="eta" defaultValue={z?.eta} className="input" maxLength={60} placeholder="Same day" /></label>
      <label className="field"><span className="field-label">Order</span><input type="number" name="sort_order" min={0} defaultValue={z?.sort_order ?? 0} className="input" /></label>
      <label className="flex items-center gap-2 pb-3 font-semibold"><input type="checkbox" name="is_active" defaultChecked={z?.is_active ?? true} className="size-5 accent-[var(--color-leaf)]" /> Active</label>
    </>
  );
}

const grid = "grid grid-cols-2 gap-3 md:grid-cols-[2fr_1fr_1.3fr_0.8fr_auto_auto] md:items-end";

export default async function DeliveryPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data }, { data: settings }] = await Promise.all([
    supabase.from("delivery_zones").select("*").order("sort_order"),
    supabase.from("store_settings").select("free_delivery_threshold_cents").eq("id", 1).single(),
  ]);

  return (
    <div>
      <PageHeader
        title="Delivery areas"
        description={`Customers choose their area at checkout and the fee is added automatically.${settings?.free_delivery_threshold_cents ? ` Orders above $${(settings.free_delivery_threshold_cents / 100).toFixed(0)} are free (change in Settings).` : ""}`}
      />
      <div className="grid gap-3">
        {((data ?? []) as Zone[]).map((z) => (
          <div key={z.id} className="rounded-3xl border border-line bg-white p-4">
            <ActionForm action={saveZone} className={grid}>
              <ZoneFields z={z} />
              <SubmitButton className="btn btn-primary btn-sm">Save</SubmitButton>
            </ActionForm>
            <div className="mt-2 flex justify-end"><DeleteButton action={deleteZone} id={z.id} confirm={`Delete ${z.name}?`} /></div>
          </div>
        ))}
      </div>
      <section className="mt-6 rounded-3xl border-2 border-dashed border-leaf/40 bg-mint/30 p-5">
        <h2 className="mb-3 font-display text-xl font-extrabold">Add an area</h2>
        <ActionForm action={saveZone} className={grid} resetOnSuccess>
          <ZoneFields />
          <SubmitButton className="btn btn-primary btn-sm">Add</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
