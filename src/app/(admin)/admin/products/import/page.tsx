import type { Metadata } from "next";
import Link from "next/link";
import { PiArrowLeftBold } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import ProductImport from "@/components/admin/product-import";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Import products" };
export const instant = false;

export default async function ImportProductsPage() {
  await requireAdmin();
  return (
    <div>
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-bold text-ink-soft hover:text-ink"><PiArrowLeftBold /> Products</Link>
      <PageHeader
        title="Import products from Excel"
        description="Add many products at once, or update prices and stock for the whole shop in one go. You'll see a preview before anything is saved."
      />
      <ProductImport />
    </div>
  );
}
