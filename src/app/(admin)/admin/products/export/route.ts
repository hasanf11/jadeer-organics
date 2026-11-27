import { getCurrentAdmin } from "@/lib/auth";
import { BADGES, isBadge } from "@/lib/badges";
import { productWorkbook, type SheetRow } from "@/lib/product-sheet";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = { published: "Published", draft: "Draft", archived: "Archived" };

/**
 * All products in the import layout (one row per size), so the admin can edit
 * them in Excel and import the file back.
 */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return new Response("Not allowed", { status: 403 });

  const supabase = await createClient();
  const [{ data: categories }, { data: products, error }] = await Promise.all([
    supabase.from("categories").select("id, name, name_ar").order("sort_order"),
    supabase
      .from("products")
      .select("slug, name, name_ar, category_id, status, is_featured, badges, tagline, tagline_ar, description, description_ar, ingredients, ingredients_ar, how_to_use, how_to_use_ar, sort_order, product_variants(label, label_ar, sku, price_cents, compare_at_cents, stock_quantity, sort_order)")
      .order("sort_order")
      .order("name")
      .limit(5000),
  ]);
  if (error) return new Response("Could not export products", { status: 500 });

  const categoryName = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const rows: SheetRow[] = [];
  for (const p of products ?? []) {
    const sizes = [...(p.product_variants ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const details: SheetRow = {
      name_ar: p.name_ar,
      category: p.category_id ? categoryName.get(p.category_id) ?? "" : "",
      status: STATUS_LABEL[p.status] ?? p.status,
      bestseller: p.is_featured ? "Yes" : "No",
      labels: (p.badges as string[]).filter(isBadge).map((b) => BADGES[b].label).join(", "),
      tagline: p.tagline,
      tagline_ar: p.tagline_ar,
      description: p.description,
      description_ar: p.description_ar,
      ingredients: p.ingredients,
      ingredients_ar: p.ingredients_ar,
      how_to_use: p.how_to_use,
      how_to_use_ar: p.how_to_use_ar,
      sort_order: p.sort_order,
    };
    (sizes.length ? sizes : [null]).forEach((v, i) => {
      rows.push({
        name: p.name,
        slug: p.slug,
        // Product details on the first row only, like the template explains.
        ...(i === 0 ? details : {}),
        size: v?.label ?? null,
        size_ar: v?.label_ar || null,
        price: v ? v.price_cents / 100 : null,
        compare_at: v?.compare_at_cents ? v.compare_at_cents / 100 : null,
        stock: v?.stock_quantity ?? null,
        sku: v?.sku ?? null,
      });
    });
  }

  const buffer = await productWorkbook(rows, categories ?? []);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="jadeer-products-${date}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
