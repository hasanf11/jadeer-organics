import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PiArrowLeftBold, PiArrowUpRightBold, PiCopyBold, PiTrashBold } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct, duplicateProduct, updateProduct } from "@/lib/admin-actions/products";
import ProductForm from "@/components/admin/product-form";
import VariantManager from "@/components/admin/variant-manager";
import ImageManager from "@/components/admin/image-manager";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import { Panel } from "@/components/admin/ui";
import type { ArtShape } from "@/lib/badges";

export const metadata: Metadata = { title: "Edit product" };
export const instant = false;

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_variants(id, label, sku, price_cents, compare_at_cents, stock_quantity, is_active, sort_order), product_images(id, path, alt, sort_order)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name, emoji").order("sort_order"),
  ]);
  if (!product) notFound();

  const variants = [...product.product_variants].sort((a, b) => a.sort_order - b.sort_order);
  const images = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-bold text-ink-soft hover:text-ink"><PiArrowLeftBold /> Products</Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-extrabold md:text-4xl">{product.name}</h1>
          <div className="flex flex-wrap gap-2">
            {product.status === "published" && (
              <Link href={`/products/${product.slug}`} target="_blank" className="btn btn-soft btn-sm">View in shop <PiArrowUpRightBold /></Link>
            )}
            <ActionForm action={duplicateProduct}>
              <input type="hidden" name="id" value={product.id} />
              <SubmitButton className="btn btn-soft btn-sm" pendingText="Copying…"><PiCopyBold /> Duplicate</SubmitButton>
            </ActionForm>
            <ActionForm action={deleteProduct} confirm={`Delete “${product.name}”? Products with orders are archived instead.`}>
              <input type="hidden" name="id" value={product.id} />
              <SubmitButton className="btn btn-soft btn-sm text-tomato" pendingText="Deleting…"><PiTrashBold /> Delete</SubmitButton>
            </ActionForm>
          </div>
        </div>
      </div>

      <Panel title="Sizes, prices & stock">
        <VariantManager productId={product.id} variants={variants} />
      </Panel>

      <Panel title="Photos">
        <ImageManager productId={product.id} images={images} />
      </Panel>

      <ProductForm
        action={updateProduct}
        categories={categories ?? []}
        values={{
          id: product.id,
          name: product.name,
          name_ar: product.name_ar,
          slug: product.slug,
          category_id: product.category_id,
          tagline: product.tagline,
          description: product.description,
          ingredients: product.ingredients,
          how_to_use: product.how_to_use,
          badges: product.badges,
          art_shape: product.art_shape as ArtShape,
          art_color: product.art_color,
          art_background: product.art_background,
          is_featured: product.is_featured,
          status: product.status,
          sort_order: product.sort_order,
        }}
      />
    </div>
  );
}
