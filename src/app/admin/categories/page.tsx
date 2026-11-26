import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteCategory, saveCategory } from "@/lib/admin-actions/setup";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import DeleteButton from "@/components/admin/delete-button";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Categories" };
export const instant = false;

type Category = { id: string; name: string; name_ar: string; slug: string; description: string; color: string; emoji: string; is_active: boolean; sort_order: number };

function CategoryFields({ c }: { c?: Category }) {
  return (
    <>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-3 sm:grid-cols-[5rem_1fr_1fr]">
        <label className="field"><span className="field-label">Emoji</span><input name="emoji" defaultValue={c?.emoji ?? "🌿"} className="input text-center text-2xl" maxLength={8} /></label>
        <label className="field"><span className="field-label">Name</span><input name="name" defaultValue={c?.name} className="input" required maxLength={80} /></label>
        <label className="field"><span className="field-label">Arabic name</span><input name="name_ar" defaultValue={c?.name_ar} className="input text-right" dir="rtl" maxLength={80} /></label>
      </div>
      <label className="field"><span className="field-label">Description</span><textarea name="description" defaultValue={c?.description} className="input min-h-20" maxLength={1000} /></label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
        <label className="field"><span className="field-label">Web address</span><input name="slug" defaultValue={c?.slug} className="input" maxLength={90} placeholder="auto" /></label>
        <label className="field"><span className="field-label">Colour</span><input type="color" name="color" defaultValue={c?.color ?? "#2f8f3a"} className="h-12 w-full rounded-xl border-2 border-line" /></label>
        <label className="field"><span className="field-label">Order</span><input type="number" name="sort_order" min={0} defaultValue={c?.sort_order ?? 0} className="input" /></label>
        <label className="flex items-center gap-2 pb-3 font-semibold"><input type="checkbox" name="is_active" defaultChecked={c?.is_active ?? true} className="size-5 accent-[var(--color-leaf)]" /> Visible</label>
      </div>
    </>
  );
}

export default async function CategoriesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*, products(count)").order("sort_order");
  const categories = (data ?? []) as (Category & { products: { count: number }[] })[];

  return (
    <div>
      <PageHeader title="Categories" description="Group your products. Categories appear in the menu, on the home page and have their own page for Google." />
      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((c) => (
          <details key={c.id} className="group rounded-3xl border border-line bg-white" style={{ borderLeft: `8px solid ${c.color}` }}>
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <span className="text-3xl">{c.emoji}</span>
              <span className="flex-1">
                <span className="block font-bold">{c.name} {!c.is_active && <span className="text-xs text-ink-soft">(hidden)</span>}</span>
                <span className="text-sm text-ink-soft">{c.products[0]?.count ?? 0} products · /category/{c.slug}</span>
              </span>
              <span className="text-sm font-bold text-leaf group-open:hidden">Edit</span>
            </summary>
            <div className="border-t border-line p-4">
              <ActionForm action={saveCategory} className="grid gap-3">
                <CategoryFields c={c} />
                <div className="flex flex-wrap justify-between gap-2">
                  <SubmitButton className="btn btn-primary btn-sm">Save</SubmitButton>
                </div>
              </ActionForm>
              <div className="mt-2 flex justify-end">
                <DeleteButton action={deleteCategory} id={c.id} confirm={`Delete “${c.name}”? Its products will stay but without a category.`} />
              </div>
            </div>
          </details>
        ))}
      </div>
      <section className="mt-6 rounded-3xl border-2 border-dashed border-leaf/40 bg-mint/30 p-5">
        <h2 className="mb-3 font-display text-xl font-extrabold">Add a category</h2>
        <ActionForm action={saveCategory} className="grid gap-3" resetOnSuccess>
          <CategoryFields />
          <SubmitButton className="btn btn-primary justify-self-start">Add category</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
