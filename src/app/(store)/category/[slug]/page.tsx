import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getStorefront, toCardProduct } from "@/lib/catalog";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/json-ld";
import ShopBrowser from "@/components/store/shop-browser";
import ProductGridSkeleton from "@/components/store/product-grid-skeleton";

export async function generateStaticParams() {
  const { categories } = await getStorefront();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { categories } = await getStorefront();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: "Category not found" };
  return pageMetadata({
    title: `${category.name} — ${category.nameAr}`,
    description: `${category.description} Shop ${category.name.toLowerCase()} online from Ja'deer Organics, delivered across Lebanon.`,
    path: `/category/${category.slug}`,
  });
}

export default function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  return (
    <Suspense fallback={<div className="container-x py-16"><ProductGridSkeleton /></div>}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

async function CategoryContent({ params }: { params: PageProps<"/category/[slug]">["params"] }) {
  const { slug } = await params;
  const { categories, products, settings } = await getStorefront();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const list = products
    .filter((p) => p.categoryId === category.id)
    .map((p) => ({ ...toCardProduct(p), categorySlug: p.categorySlug, featured: p.featured, createdAt: p.createdAt, sortOrder: p.sortOrder }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: category.name, path: `/category/${category.slug}` },
        ])}
      />
      <section className="relative overflow-hidden" style={{ background: `${category.color}1f` }}>
        <div aria-hidden="true" className="absolute -right-10 top-1/2 -translate-y-1/2 select-none text-[14rem] leading-none opacity-20 md:right-10 md:text-[18rem]">
          {category.emoji}
        </div>
        <div className="container-x relative py-10 md:py-16">
          <nav aria-label="Breadcrumb" className="text-sm font-semibold text-ink-soft">
            <Link href="/" className="hover:text-ink">Home</Link> / <Link href="/shop" className="hover:text-ink">Shop</Link> /{" "}
            <span className="text-ink">{category.name}</span>
          </nav>
          <p className="arabic mt-4 text-2xl" dir="rtl" lang="ar" style={{ color: category.color }}>
            {category.nameAr}
          </p>
          <h1 className="display-xl" style={{ color: category.color }}>
            {category.name}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-ink-soft">{category.description}</p>
        </div>
      </section>

      <div className="container-x mt-6">
        <div className="scrollbar-none -mx-4 mb-8 flex gap-2 overflow-x-auto px-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              aria-current={c.slug === category.slug ? "page" : undefined}
              className={`chip shrink-0 border-2 px-4 py-2.5 text-sm ${
                c.slug === category.slug ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-ink"
              }`}
            >
              {c.emoji} {c.name}
            </Link>
          ))}
        </div>
        <Suspense fallback={<ProductGridSkeleton />}>
          <ShopBrowser products={list} categories={[]} lowStockThreshold={settings.low_stock_threshold} lockedCategory={category.slug} />
        </Suspense>
      </div>
    </>
  );
}
