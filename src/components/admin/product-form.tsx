"use client";

import { useState } from "react";
import ProductArt from "@/components/product-art";
import ActionForm, { SubmitButton, type ActionState } from "@/components/admin/action-form";
import { ART_SHAPES, BADGES, BADGE_KEYS, type ArtShape } from "@/lib/badges";
import { slugify } from "@/lib/format";

export type ProductFormValues = {
  id?: string;
  name: string;
  name_ar: string;
  slug: string;
  category_id: string | null;
  tagline: string;
  description: string;
  ingredients: string;
  how_to_use: string;
  badges: string[];
  art_shape: ArtShape;
  art_color: string;
  art_background: string;
  is_featured: boolean;
  status: string;
  sort_order: number;
};

const SWATCHES = [
  ["#2f8f3a", "#e3f4d8"],
  ["#d7261e", "#fde3df"],
  ["#e8b400", "#fff6cc"],
  ["#6e1423", "#fbe1e4"],
  ["#0f8b8d", "#d8f2f0"],
  ["#d63f7a", "#fde3ee"],
  ["#e4572e", "#ffe4d6"],
  ["#5a1e16", "#f6e1d3"],
];

export default function ProductForm({
  action,
  values,
  categories,
  isNew = false,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  values: ProductFormValues;
  categories: { id: string; name: string }[];
  isNew?: boolean;
}) {
  const [name, setName] = useState(values.name);
  const [slug, setSlug] = useState(values.slug);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [shape, setShape] = useState<ArtShape>(values.art_shape);
  const [color, setColor] = useState(values.art_color);
  const [background, setBackground] = useState(values.art_background);

  return (
    <ActionForm action={action} className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid content-start gap-6">
        <section className="grid gap-4 rounded-3xl border border-line bg-white p-5 md:p-6">
          <h2 className="font-display text-xl">Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="p-name">Name (English)</label>
              <input
                id="p-name"
                name="name"
                className="input"
                required
                maxLength={120}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="field">
              <label htmlFor="p-name-ar">Name (Arabic)</label>
              <input id="p-name-ar" name="name_ar" className="input text-right" dir="rtl" lang="ar" maxLength={120} defaultValue={values.name_ar} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="p-slug">Web address</label>
            <div className="flex items-center rounded-2xl border-2 border-line bg-cream pl-3 focus-within:border-leaf">
              <span className="shrink-0 text-sm text-ink-soft">/products/</span>
              <input
                id="p-slug"
                name="slug"
                className="min-h-12 min-w-0 flex-1 rounded-r-2xl bg-white px-3 outline-none"
                required
                maxLength={130}
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="p-category">Category</label>
              <select id="p-category" name="category_id" className="input" defaultValue={values.category_id ?? ""}>
                <option value="">— No category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-tagline">Short tagline</label>
              <input id="p-tagline" name="tagline" className="input" maxLength={200} defaultValue={values.tagline} placeholder="e.g. Cold-pressed from Lebanese groves." />
            </div>
          </div>
          <div className="field">
            <label htmlFor="p-description">Description</label>
            <textarea id="p-description" name="description" className="input min-h-36" maxLength={10000} defaultValue={values.description} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="p-ingredients">Ingredients</label>
              <textarea id="p-ingredients" name="ingredients" className="input" maxLength={3000} defaultValue={values.ingredients} />
            </div>
            <div className="field">
              <label htmlFor="p-how">How to use / storage</label>
              <textarea id="p-how" name="how_to_use" className="input" maxLength={3000} defaultValue={values.how_to_use} />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-white p-5 md:p-6">
          <h2 className="font-display text-xl">Labels</h2>
          <p className="mb-3 text-sm text-ink-soft">Shown on the product and used by the shop filters.</p>
          <div className="flex flex-wrap gap-2">
            {BADGE_KEYS.map((badge) => (
              <label key={badge} className="cursor-pointer">
                <input type="checkbox" name="badges" value={badge} defaultChecked={values.badges.includes(badge)} className="peer sr-only" />
                <span
                  className="chip border-2 border-transparent px-3.5 py-2 text-sm opacity-50 transition-all peer-checked:border-current peer-checked:opacity-100 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-sun"
                  style={{ color: BADGES[badge].color, background: BADGES[badge].bg }}
                >
                  {BADGES[badge].label}
                </span>
              </label>
            ))}
          </div>
        </section>

        {isNew && (
          <section className="grid gap-4 rounded-3xl border border-line bg-white p-5 md:p-6">
            <h2 className="font-display text-xl">First size</h2>
            <p className="-mt-2 text-sm text-ink-soft">You can add more sizes after saving.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="field">
                <label htmlFor="first-label">Size</label>
                <input id="first-label" name="first_label" className="input" placeholder="500 ml" maxLength={40} />
              </div>
              <div className="field">
                <label htmlFor="first-price">Price ($)</label>
                <input id="first-price" name="first_price" className="input" inputMode="decimal" placeholder="6.50" />
              </div>
              <div className="field">
                <label htmlFor="first-stock">Stock</label>
                <input id="first-stock" name="first_stock" type="number" min={0} className="input" defaultValue={0} />
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="grid content-start gap-6">
        <section className="grid gap-4 rounded-3xl border border-line bg-white p-5 md:p-6">
          <h2 className="font-display text-xl">Visibility</h2>
          <div className="field">
            <label htmlFor="p-status">Status</label>
            <select id="p-status" name="status" className="input" defaultValue={values.status}>
              <option value="published"> Published — visible in the shop</option>
              <option value="draft"> Draft — hidden</option>
              <option value="archived"> Archived</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-cream p-3 font-semibold">
            Show in “Bestsellers” on the home page
            <input type="checkbox" name="is_featured" defaultChecked={values.is_featured} className="size-5 accent-[var(--color-leaf)]" />
          </label>
          <div className="field">
            <label htmlFor="p-sort">Display order</label>
            <input id="p-sort" name="sort_order" type="number" min={0} className="input" defaultValue={values.sort_order} />
            <p className="field-hint">Smaller numbers appear first.</p>
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-line bg-white p-5 md:p-6">
          <h2 className="font-display text-xl">Illustration</h2>
          <p className="-mt-2 text-sm text-ink-soft">Used whenever the product has no photo.</p>
          <div className="mx-auto w-44 overflow-hidden rounded-2xl">
            <ProductArt shape={shape} color={color} background={background} name={name || "Product"} />
          </div>
          <div className="field">
            <label htmlFor="p-shape">Container</label>
            <select id="p-shape" name="art_shape" className="input" value={shape} onChange={(e) => setShape(e.target.value as ArtShape)}>
              {ART_SHAPES.map((s) => (
                <option key={s} value={s}>{s.replace("-", " ")}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Colour presets">
            {SWATCHES.map(([c, bg]) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setBackground(bg);
                }}
                className="size-9 rounded-full border-4 transition-transform hover:scale-110"
                style={{ background: c, borderColor: bg }}
                aria-label={`Use colour ${c}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="field">
              <span className="field-label">Colour</span>
              <input type="color" name="art_color" value={color} onChange={(e) => setColor(e.target.value)} className="h-12 w-full cursor-pointer rounded-xl border-2 border-line" />
            </label>
            <label className="field">
              <span className="field-label">Background</span>
              <input type="color" name="art_background" value={background} onChange={(e) => setBackground(e.target.value)} className="h-12 w-full cursor-pointer rounded-xl border-2 border-line" />
            </label>
          </div>
        </section>

        <div className="sticky bottom-20 z-10 rounded-3xl bg-white/90 p-3 shadow-pop backdrop-blur lg:bottom-4">
          <SubmitButton className="btn btn-primary w-full">{isNew ? "Create product" : "Save changes"}</SubmitButton>
        </div>
      </div>
    </ActionForm>
  );
}
