"use client";

import { useState } from "react";
import { PiPlusBold, PiTrashBold } from "react-icons/pi";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import { deleteVariant, saveVariant } from "@/lib/admin-actions/products";
import { adjustStock } from "@/lib/admin-actions/inventory";
import { dollarsInput } from "@/lib/format";

type VariantRow = {
  id: string;
  label: string;
  sku: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  stock_quantity: number;
  is_active: boolean;
  sort_order: number;
};

export function StockAdjuster({ variantId, productId, current }: { variantId: string; productId?: string; current: number }) {
  const [mode, setMode] = useState("received");
  return (
    <ActionForm action={adjustStock} className="grid grid-cols-[1fr_5rem_auto] items-end gap-2" resetOnSuccess>
      <input type="hidden" name="variant_id" value={variantId} />
      {productId && <input type="hidden" name="product_id" value={productId} />}
      <input type="hidden" name="current" value={current} />
      <select name="mode" value={mode} onChange={(e) => setMode(e.target.value)} className="input min-h-10 py-1.5 text-sm" aria-label="Stock change">
        <option value="received">➕ Received</option>
        <option value="damaged">➖ Damaged / used</option>
        <option value="set">✏️ Set count to</option>
      </select>
      <input name="amount" type="number" min={0} max={100000} required className="input min-h-10 py-1.5 text-sm" aria-label="Quantity" placeholder={mode === "set" ? String(current) : "Qty"} />
      <SubmitButton className="btn btn-ink btn-sm" pendingText="…">OK</SubmitButton>
    </ActionForm>
  );
}

export default function VariantManager({ productId, variants }: { productId: string; variants: VariantRow[] }) {
  const [adding, setAdding] = useState(variants.length === 0);

  return (
    <div className="grid gap-3">
      {variants.map((v) => (
        <div key={v.id} className={`rounded-2xl border-2 p-3 ${v.is_active ? "border-line" : "border-dashed border-line opacity-70"}`}>
          <ActionForm action={saveVariant} className="grid grid-cols-2 gap-2 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto] md:items-end">
            <input type="hidden" name="id" value={v.id} />
            <input type="hidden" name="product_id" value={productId} />
            <input type="hidden" name="sort_order" value={v.sort_order} />
            <label className="field">
              <span className="field-label text-xs">Size</span>
              <input name="label" defaultValue={v.label} className="input min-h-10 py-1.5" required maxLength={40} />
            </label>
            <label className="field">
              <span className="field-label text-xs">Price $</span>
              <input name="price" defaultValue={dollarsInput(v.price_cents)} className="input min-h-10 py-1.5" inputMode="decimal" required />
            </label>
            <label className="field">
              <span className="field-label text-xs">Was $ (sale)</span>
              <input name="compare_at" defaultValue={dollarsInput(v.compare_at_cents)} className="input min-h-10 py-1.5" inputMode="decimal" placeholder="—" />
            </label>
            <label className="field">
              <span className="field-label text-xs">SKU</span>
              <input name="sku" defaultValue={v.sku ?? ""} className="input min-h-10 py-1.5" maxLength={60} placeholder="—" />
            </label>
            <label className="flex items-center gap-2 pb-2.5 text-sm font-semibold">
              <input type="checkbox" name="is_active" defaultChecked={v.is_active} className="size-5 accent-[var(--color-leaf)]" />
              <input type="hidden" name="is_active" value="false" />
              On sale
            </label>
            <SubmitButton className="btn btn-primary btn-sm" pendingText="…">Save</SubmitButton>
          </ActionForm>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-3">
            <p className="text-sm">
              In stock:{" "}
              <strong className={v.stock_quantity === 0 ? "text-tomato" : v.stock_quantity <= 5 ? "text-orange" : "text-leaf"}>{v.stock_quantity}</strong>
            </p>
            <div className="w-full max-w-sm">
              <StockAdjuster variantId={v.id} productId={productId} current={v.stock_quantity} />
            </div>
            <ActionForm action={deleteVariant} confirm={`Delete the size “${v.label}”?`}>
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="product_id" value={productId} />
              <SubmitButton className="icon-btn text-ink-soft hover:text-tomato" pendingText="…">
                <PiTrashBold size={18} aria-label="Delete size" />
              </SubmitButton>
            </ActionForm>
          </div>
        </div>
      ))}

      {adding ? (
        <ActionForm action={saveVariant} resetOnSuccess className="grid grid-cols-2 gap-2 rounded-2xl bg-mint/50 p-3 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] md:items-end">
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="sort_order" value={variants.length} />
          <label className="field">
            <span className="field-label text-xs">New size</span>
            <input name="label" className="input min-h-10 py-1.5" required maxLength={40} placeholder="1 L" />
          </label>
          <label className="field">
            <span className="field-label text-xs">Price $</span>
            <input name="price" className="input min-h-10 py-1.5" inputMode="decimal" required placeholder="12.00" />
          </label>
          <label className="field">
            <span className="field-label text-xs">Was $ (optional)</span>
            <input name="compare_at" className="input min-h-10 py-1.5" inputMode="decimal" />
          </label>
          <label className="field">
            <span className="field-label text-xs">Starting stock</span>
            <input name="stock" type="number" min={0} defaultValue={0} className="input min-h-10 py-1.5" />
          </label>
          <SubmitButton className="btn btn-primary btn-sm" pendingText="…">Add</SubmitButton>
        </ActionForm>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="btn btn-soft justify-self-start">
          <PiPlusBold /> Add a size
        </button>
      )}
    </div>
  );
}
