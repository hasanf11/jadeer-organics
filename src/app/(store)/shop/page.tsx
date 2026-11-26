import { Suspense } from "react";
import { getStorefront, toCardProduct } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import ShopBrowser from "@/components/store/shop-browser";
import ProductGridSkeleton from "@/components/store/product-grid-skeleton";
import ScrollVelocity from "@/components/motion/scroll-velocity";

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
      <section className="relative overflow-hidden bg-mint">
        <div className="container-x py-10 md:py-14">
          <p className="eyebrow">The Ja&apos;deer market</p>
          <h1 className="display-xl mt-2">Shop all</h1>
          <p className="mt-3 max-w-xl text-lg text-ink-soft">
            {products.length} clean, honest products — organic, preservative-free and made with love in Lebanon.
          </p>
        </div>
        <div className="bg-leaf py-2 text-white">
          <ScrollVelocity
            items={categories.map((c) => `${c.emoji} ${c.name}`)}
            speed={30}
            itemClassName="font-display text-lg font-bold"
            separator="•"
          />
        </div>
      </section>

      <div className="container-x mt-8">
        <Suspense fallback={<ProductGridSkeleton />}>
          <ShopBrowser
            products={shopProducts}
            categories={categories.map(({ slug, name, emoji, color, productCount }) => ({ slug, name, emoji, color, productCount }))}
            lowStockThreshold={settings.low_stock_threshold}
          />
        </Suspense>
      </div>
    </>
  );
}
