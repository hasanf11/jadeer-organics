import type { Metadata } from "next";
import Link from "next/link";
import { PiMagnifyingGlassBold, PiPlusBold, PiStarFill } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { shortMoney } from "@/lib/format";
import ProductVisual from "@/components/product-visual";
import { Empty, PageHeader, Pill } from "@/components/admin/ui";
import type { ArtShape } from "@/lib/badges";

export const metadata: Metadata = { title: "Products" };
export const instant = false;

const STATUS = {
  published: { label: "Live", color: "#23752e", bg: "#e3f4d8" },
  draft: { label: "Draft", color: "#8a5a00", bg: "#fff0b8" },
  archived: { label: "Archived", color: "#5b4a43", bg: "#efe6da" },
} as Record<string, { label: string; color: string; bg: string }>;

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const status = typeof params.status === "string" && params.status in STATUS ? params.status : "";
  const category = typeof params.category === "string" ? params.category : "";

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, name, name_ar, slug, status, is_featured, art_shape, art_color, art_background, category_id, categories(name, emoji), product_variants(price_cents, stock_quantity, is_active), product_images(path, sort_order)")
    .order("sort_order")
    .order("name");
  if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
  if (status) query = query.eq("status", status);
  if (/^[0-9a-f-]{36}$/i.test(category)) query = query.eq("category_id", category);

  const [{ data: products }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("id, name, emoji").order("sort_order"),
  ]);

  return (
    <div>
      <PageHeader
        title="Products"
        description="Everything in your shop. Tap a product to edit its details, sizes, prices, stock and photos."
        actions={<Link href="/admin/products/new" className="btn btn-primary"><PiPlusBold /> New product</Link>}
      />

      <form className="mb-5 flex flex-wrap gap-2" role="search">
        <div className="relative min-w-60 flex-1">
          <PiMagnifyingGlassBold className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input name="q" defaultValue={q} placeholder="Search products" className="input rounded-full pl-11" aria-label="Search products" />
        </div>
        <select name="category" defaultValue={category} className="input w-auto rounded-full" aria-label="Category">
          <option value="">All categories</option>
          {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={status} className="input w-auto rounded-full" aria-label="Status">
          <option value="">Any status</option>
          <option value="published">Live</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <button type="submit" className="btn btn-ink">Filter</button>
      </form>

      {!products?.length ? (
        <Empty title="No products found" text="Try another search, or add a new product." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => {
            const variants = p.product_variants.filter((v) => v.is_active);
            const stock = variants.reduce((s, v) => s + v.stock_quantity, 0);
            const prices = variants.map((v) => v.price_cents);
            const image = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.path;
            const cat = p.categories as unknown as { name: string; emoji: string } | null;
            return (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex gap-3 rounded-3xl border border-line bg-white p-3 transition-shadow hover:shadow-soft">
                  <span className="relative block h-24 w-20 shrink-0 overflow-hidden rounded-2xl" style={{ background: p.art_background }}>
                    <ProductVisual image={image} alt={p.name} art={{ shape: p.art_shape as ArtShape, color: p.art_color, background: p.art_background }} sizes="80px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate font-bold">{p.name}</span>
                      {p.is_featured && <PiStarFill className="shrink-0 text-sun" aria-label="Featured" />}
                    </span>
                    <span className="block truncate text-xs text-ink-soft">{cat ? cat.name : "No category"}</span>
                    <span className="mt-1 block text-sm font-semibold">
                      {prices.length ? (Math.min(...prices) === Math.max(...prices) ? shortMoney(prices[0]) : `${shortMoney(Math.min(...prices))} – ${shortMoney(Math.max(...prices))}`) : "No sizes yet"}
                      <span className="text-ink-soft"> · {variants.length} size{variants.length === 1 ? "" : "s"}</span>
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      <Pill color={STATUS[p.status].color} bg={STATUS[p.status].bg}>{STATUS[p.status].label}</Pill>
                      <Pill color={stock === 0 ? "#a91b1b" : stock <= 5 ? "#8a5a00" : "#23752e"} bg={stock === 0 ? "#fde4e4" : stock <= 5 ? "#fff0b8" : "#e3f4d8"}>
                        {stock === 0 ? "Out of stock" : `${stock} in stock`}
                      </Pill>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
