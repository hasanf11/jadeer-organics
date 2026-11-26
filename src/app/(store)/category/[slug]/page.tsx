import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { imageUrl } from "@/lib/images";
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

  const banner = imageUrl(category.image);
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
      <section className="container-x pt-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <Link href="/" className="hover:text-ink">Home</Link> <span className="mx-1.5">/</span>
          <Link href="/shop" className="hover:text-ink">Shop</Link> <span className="mx-1.5">/</span>
          <span className="text-ink">{category.name}</span>
        </nav>
        <div className="mt-6 grid items-end gap-8 overflow-hidden rounded-3xl bg-sand md:grid-cols-[1.2fr_1fr]">
          <div className="p-8 md:p-12">
            <p className="arabic text-lg text-ink-soft" dir="rtl" lang="ar">{category.nameAr}</p>
            <h1 className="display-xl mt-1">{category.name}</h1>
            <p className="mt-4 max-w-lg text-lg text-ink-soft">{category.description}</p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">{list.length} products</p>
          </div>
          {banner && (
            <div className="relative h-64 md:h-full md:min-h-80">
              <Image src={banner} alt="" fill priority sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
            </div>
          )}
        </div>
      </section>

      <div className="container-x mt-10">
        <div className="scrollbar-none -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              aria-current={c.slug === category.slug ? "page" : undefined}
              className={`chip shrink-0 px-4 py-2.5 text-[0.82rem] ${
                c.slug === category.slug ? "bg-ink text-cream" : "bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:shadow-[inset_0_0_0_1px_var(--color-ink)]"
              }`}
            >
              {c.name}
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
