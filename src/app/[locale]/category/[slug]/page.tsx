import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getStorefront, getStorefrontFor, toCardProduct } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n/server";
import { imageUrl } from "@/lib/images";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/json-ld";
import ShopBrowser from "@/components/store/shop-browser";
import ProductGridSkeleton from "@/components/store/product-grid-skeleton";
import CategoryIcon from "@/components/store/category-icon";

export async function generateStaticParams() {
  const { categories } = await getStorefrontFor("en");
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getI18n();
  const { categories } = await getStorefront();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  return pageMetadata({ locale, title: category.name, description: category.description, path: `/category/${category.slug}`, image: imageUrl(category.image) });
}

export default function CategoryPage({ params }: PageProps<"/[locale]/category/[slug]">) {
  return (
    <Suspense fallback={<div className="container-x py-16"><ProductGridSkeleton /></div>}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

async function CategoryContent({ params }: { params: PageProps<"/[locale]/category/[slug]">["params"] }) {
  const { slug } = await params;
  const { t, href } = await getI18n();
  const { categories, products, settings } = await getStorefront();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const banner = imageUrl(category.image);
  const list = products
    .filter((p) => p.categoryId === category.id)
    .map((p) => ({ ...toCardProduct(p), categorySlug: p.categorySlug, featured: p.featured, createdAt: p.createdAt, sortOrder: p.sortOrder }));

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: t.common.home, path: href("/") }, { name: t.common.shop, path: href("/shop") }, { name: category.name, path: href(`/category/${category.slug}`) }])} />
      <section className="container-x pt-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <Link href={href("/")} className="hover:text-ink">{t.common.home}</Link> <span className="mx-1.5">/</span>
          <Link href={href("/shop")} className="hover:text-ink">{t.common.shop}</Link> <span className="mx-1.5">/</span>
          <span className="text-ink">{category.name}</span>
        </nav>
        <div className="grain relative mt-5 grid items-stretch overflow-hidden rounded-[2rem] text-white md:grid-cols-[1.2fr_1fr]" style={{ background: category.color }}>
          <div className="relative p-7 md:p-12">
            <span className="grid size-14 place-items-center rounded-2xl bg-white/20">
              <CategoryIcon slug={category.slug} size={28} />
            </span>
            <h1 className="display-xl mt-5">{category.name}</h1>
            <p className="mt-4 max-w-lg text-lg text-white/85">{category.description}</p>
            <p className="mt-6 text-sm font-bold text-white/75">{t.shop.categoryProducts(list.length)}</p>
          </div>
          {banner && (
            <div className="relative h-60 md:h-auto md:min-h-80">
              <Image src={banner} alt="" fill priority sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
            </div>
          )}
        </div>
      </section>

      <div className="container-x mt-8">
        <div className="scroll-row -mx-[1.15rem] mb-10 gap-2 px-[1.15rem] md:mx-0 md:flex-wrap md:px-0">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={href(`/category/${c.slug}`)}
              aria-current={c.slug === category.slug ? "page" : undefined}
              className={`chip shrink-0 px-4 py-2.5 text-[0.85rem] ${c.slug === category.slug ? "text-white" : "bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-line)]"}`}
              style={c.slug === category.slug ? { background: c.color } : undefined}
            >
              <CategoryIcon slug={c.slug} size={15} /> {c.name}
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
