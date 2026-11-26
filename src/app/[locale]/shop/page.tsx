import type { Metadata } from "next";
import { Suspense } from "react";
import { getStorefront, toCardProduct } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import ShopBrowser from "@/components/store/shop-browser";
import ProductGridSkeleton from "@/components/store/product-grid-skeleton";
import CategoryIcon from "@/components/store/category-icon";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return pageMetadata({ locale, title: t.shop.metaTitle, description: t.shop.metaDescription, path: "/shop" });
}

export default async function ShopPage() {
  const { t, href } = await getI18n();
  const { products, categories, settings } = await getStorefront();
  const shopProducts = products.map((p) => ({ ...toCardProduct(p), categorySlug: p.categorySlug, featured: p.featured, createdAt: p.createdAt, sortOrder: p.sortOrder }));

  return (
    <>
      <section className="grain relative overflow-hidden bg-leaf text-cream">
        <div aria-hidden="true" className="absolute -end-24 -top-24 size-80 rounded-full bg-sun/30 blur-3xl" />
        <div className="container-x relative py-12 md:py-16">
          <p className="eyebrow text-sun">{t.shop.eyebrow}</p>
          <h1 className="display-xl mt-3">{t.shop.title}</h1>
          <p className="mt-3 max-w-xl text-lg text-cream/80">{t.shop.intro(products.length)}</p>
          <div className="scroll-row -mx-[1.15rem] mt-7 gap-2 px-[1.15rem] md:mx-0 md:flex-wrap md:px-0">
            {categories.map((c) => (
              <Link key={c.slug} href={href(`/category/${c.slug}`)} className="chip shrink-0 bg-white/12 px-4 py-2.5 text-[0.85rem] text-cream ring-1 ring-white/20 transition-colors hover:bg-white hover:text-ink">
                <CategoryIcon slug={c.slug} size={16} /> {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container-x mt-10">
        <Suspense fallback={<ProductGridSkeleton />}>
          <ShopBrowser products={shopProducts} categories={categories.map(({ slug, name, productCount }) => ({ slug, name, productCount }))} lowStockThreshold={settings.low_stock_threshold} />
        </Suspense>
      </div>
    </>
  );
}
