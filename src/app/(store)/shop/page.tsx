import { Suspense } from "react";
import { getStorefront, toCardProduct } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import ShopBrowser from "@/components/store/shop-browser";
import ProductGridSkeleton from "@/components/store/product-grid-skeleton";

export const metadata = pageMetadata({
  title: "Shop organic products",
  description:
    "Shop Ja'deer's organic olive oil, molasses, healthy sauces, natural syrups, matcha and organic body care. Delivered across Lebanon, cash on delivery.",
  path: "/shop",
});

export default async function ShopPage() {
  const { products, categories, settings } = await getStorefront();

  const shopProducts = products.map((p) => ({
    ...toCardProduct(p),
    categorySlug: p.categorySlug,
    featured: p.featured,
    createdAt: p.createdAt,
    sortOrder: p.sortOrder,
  }));

  return (
    <>
      <section className="container-x pt-10 md:pt-16">
        <p className="eyebrow">The Ja&apos;deer pantry</p>
        <h1 className="display-xl mt-4">Shop all</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-soft">
          {products.length} honest products — organic, preservative-free and made with care in Lebanon.
        </p>
      </section>

      <div className="container-x mt-10">
        <Suspense fallback={<ProductGridSkeleton />}>
          <ShopBrowser
            products={shopProducts}
            categories={categories.map(({ slug, name, productCount }) => ({ slug, name, productCount }))}
            lowStockThreshold={settings.low_stock_threshold}
          />
        </Suspense>
      </div>
    </>
  );
}
