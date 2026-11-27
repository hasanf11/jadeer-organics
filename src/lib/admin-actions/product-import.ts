"use server";

import { revalidatePath } from "next/cache";
import { adminClient, refreshStore } from "@/lib/admin";
import { parseProductFile, type ExistingCatalog, type ImportIssue, type ParsedImport } from "@/lib/product-sheet";

const MAX_BYTES = 5 * 1024 * 1024;

export type ImportPreview = {
  ok: boolean;
  fileName: string;
  errors: ImportIssue[];
  warnings: ImportIssue[];
  summary: { newProducts: number; updatedProducts: number; newSizes: number; updatedSizes: number };
  items: {
    name: string;
    isNew: boolean;
    category: string;
    status: string;
    sizes: { label: string; price: number | null; stock: number | null; isNew: boolean }[];
  }[];
};

type Supabase = Awaited<ReturnType<typeof adminClient>>["supabase"];

async function existingCatalog(supabase: Supabase): Promise<ExistingCatalog> {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name, name_ar, slug").order("sort_order"),
    supabase.from("products").select("slug, name, product_variants(label, price_cents)").limit(5000),
  ]);
  return {
    categories: categories ?? [],
    products: (products ?? []).map((p) => ({ slug: p.slug, name: p.name, variants: p.product_variants ?? [] })),
  };
}

async function readUpload(formData: FormData, supabase: Supabase): Promise<{ parsed: ParsedImport; catalog: ExistingCatalog; fileName: string }> {
  const file = formData.get("file");
  const fail = (message: string, fileName = "") => ({
    parsed: { products: [], errors: [{ row: null, message }], warnings: [] },
    catalog: { categories: [], products: [] },
    fileName,
  });
  if (!(file instanceof File) || file.size === 0) return fail("Please choose an Excel file.");
  if (file.size > MAX_BYTES) return fail("The file is larger than 5 MB. Please split it into smaller files.", file.name);
  if (/\.(xls|csv|numbers|ods)$/i.test(file.name)) {
    return fail("Please save the file as an Excel Workbook (.xlsx): in Excel choose File → Save As → Excel Workbook.", file.name);
  }
  const catalog = await existingCatalog(supabase);
  const parsed = await parseProductFile(await file.arrayBuffer(), catalog);
  return { parsed, catalog, fileName: file.name };
}

/** Step 1: read the file and show what will happen. Nothing is saved. */
export async function previewProductImport(formData: FormData): Promise<ImportPreview> {
  const { supabase } = await adminClient();
  const { parsed, catalog, fileName } = await readUpload(formData, supabase);
  const existing = new Map(catalog.products.map((p) => [p.slug, p]));
  const categoryName = new Map(catalog.categories.map((c) => [c.id, c.name]));

  const summary = { newProducts: 0, updatedProducts: 0, newSizes: 0, updatedSizes: 0 };
  const items = parsed.products.map((p) => {
    const current = existing.get(p.slug);
    if (current) summary.updatedProducts += 1;
    else summary.newProducts += 1;
    const sizes = p.variants.map((v) => {
      const isNew = !current?.variants.some((cv) => cv.label.toLowerCase() === v.label.toLowerCase());
      if (isNew) summary.newSizes += 1;
      else summary.updatedSizes += 1;
      return { label: v.label, price: v.price_cents, stock: v.stock, isNew };
    });
    return {
      name: p.name,
      isNew: !current,
      category: p.category_id ? categoryName.get(p.category_id) ?? "" : "",
      status: p.status ?? (current ? "" : "published"),
      sizes,
    };
  });

  return {
    ok: parsed.errors.length === 0,
    fileName,
    errors: parsed.errors.slice(0, 200),
    warnings: parsed.warnings.slice(0, 100),
    summary,
    items: items.slice(0, 500),
  };
}

/** Step 2: read the same file again, check it again and save everything in one go. */
export async function importProductFile(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const { supabase } = await adminClient();
  const { parsed } = await readUpload(formData, supabase);
  if (parsed.errors.length) {
    return { ok: false, message: `The file has ${parsed.errors.length} problem${parsed.errors.length === 1 ? "" : "s"}. Nothing was imported.` };
  }
  if (parsed.products.length > 1000) return { ok: false, message: "Please import up to 1000 products at a time." };

  const { data, error } = await supabase.rpc("admin_import_products", { p_products: parsed.products });
  if (error) {
    console.error("Product import failed", error);
    const hint =
      error.code === "23505" ? " Two products would get the same web address." : error.code === "PGRST202" ? " The import needs the latest database update (see README)." : "";
    return { ok: false, message: `The import didn't go through and nothing was changed.${hint}` };
  }

  refreshStore();
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  const r = data as { products_created: number; products_updated: number; sizes_created: number; sizes_updated: number };
  const parts = [
    r.products_created && `${r.products_created} new product${r.products_created === 1 ? "" : "s"}`,
    r.products_updated && `${r.products_updated} product${r.products_updated === 1 ? "" : "s"} updated`,
    r.sizes_created && `${r.sizes_created} new size${r.sizes_created === 1 ? "" : "s"}`,
    r.sizes_updated && `${r.sizes_updated} size${r.sizes_updated === 1 ? "" : "s"} updated`,
  ].filter(Boolean);
  return { ok: true, message: `Done: ${parts.join(", ")}.` };
}
