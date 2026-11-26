import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deletePartner, savePartner } from "@/lib/admin-actions/setup";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import DeleteButton from "@/components/admin/delete-button";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Retail partners" };
export const instant = false;

type Partner = { id: string; name: string; url: string; is_active: boolean; sort_order: number };
const grid = "grid grid-cols-2 gap-3 md:grid-cols-[1.4fr_2fr_0.7fr_auto_auto] md:items-end";

function Fields({ p }: { p?: Partner }) {
  return (
    <>
      {p && <input type="hidden" name="id" value={p.id} />}
      <label className="field"><span className="field-label">Shop name</span><input name="name" defaultValue={p?.name} className="input" required maxLength={80} /></label>
      <label className="field"><span className="field-label">Website (optional)</span><input name="url" defaultValue={p?.url} className="input" maxLength={300} placeholder="https://" /></label>
      <label className="field"><span className="field-label">Order</span><input type="number" name="sort_order" min={0} defaultValue={p?.sort_order ?? 0} className="input" /></label>
      <label className="flex items-center gap-2 pb-3 font-semibold"><input type="checkbox" name="is_active" defaultChecked={p?.is_active ?? true} className="size-5 accent-[var(--color-leaf)]" /> Show</label>
    </>
  );
}

export default async function PartnersPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("retail_partners").select("*").order("sort_order");
  return (
    <div>
      <PageHeader title="Retail partners" description="Shops that also sell Ja'deer products — shown on the home page under “Also available at”." />
      <div className="grid gap-3">
        {((data ?? []) as Partner[]).map((p) => (
          <div key={p.id} className="rounded-3xl border border-line bg-white p-4">
            <ActionForm action={savePartner} className={grid}><Fields p={p} /><SubmitButton className="btn btn-primary btn-sm">Save</SubmitButton></ActionForm>
            <div className="mt-2 flex justify-end"><DeleteButton action={deletePartner} id={p.id} confirm={`Remove ${p.name}?`} /></div>
          </div>
        ))}
      </div>
      <section className="mt-6 rounded-3xl border-2 border-dashed border-leaf/40 bg-mint/30 p-5">
        <h2 className="mb-3 font-display text-xl font-extrabold">Add a partner</h2>
        <ActionForm action={savePartner} className={grid} resetOnSuccess><Fields /><SubmitButton className="btn btn-primary btn-sm">Add</SubmitButton></ActionForm>
      </section>
    </div>
  );
}
