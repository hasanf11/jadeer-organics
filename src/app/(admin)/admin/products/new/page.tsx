import type { Metadata } from "next";
import Link from "next/link";
import { PiArrowLeftBold } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createProduct } from "@/lib/admin-actions/products";
import ProductForm from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "New product" };
export const instant = false;

export default async function NewProductPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name, emoji").order("sort_order");

  return (
    <div>
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-bold text-ink-soft hover:text-ink"><PiArrowLeftBold /> Products</Link>
      <PageHeader title="New product" description="Fill in the details, then add photos and more sizes on the next screen." />
      <ProductForm
        isNew
        action={createProduct}
        categories={categories ?? []}
        values={{
          name: "", name_ar: "", slug: "", category_id: null, tagline: "", tagline_ar: "", description: "", description_ar: "", ingredients: "", ingredients_ar: "", how_to_use: "", how_to_use_ar: "",
          badges: ["organic", "preservative-free"], art_shape: "bottle", art_color: "#2f8f3a", art_background: "#e3f4d8",
          is_featured: false, status: "published", sort_order: 100,
        }}
      />
    </div>
  );
}
