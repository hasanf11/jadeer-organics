import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PiCheck, PiStarFill } from "react-icons/pi";
import { getProductReviews, getStorefront, toCardProduct } from "@/lib/catalog";
import { BADGES } from "@/lib/badges";
import { formatDate } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { breadcrumbJsonLd, pageMetadata, productJsonLd } from "@/lib/seo";
import JsonLd from "@/components/json-ld";
import ProductGallery from "@/components/store/product-gallery";
import ProductPurchase from "@/components/store/product-purchase";
import ProductCard from "@/components/store/product-card";
import ReviewForm from "@/components/store/review-form";

export async function generateStaticParams() {
  const { products } = await getStorefront();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getStorefront();
  const product = products.find((p) => p.slug === slug);
  if (!product) return { title: "Product not found" };
  const image = imageUrl(product.images[0]?.path);
  return pageMetadata({
    title: `${product.name}${product.nameAr ? ` — ${product.nameAr}` : ""}`,
    description: `${product.tagline} ${product.description}`.slice(0, 158),
    path: `/products/${product.slug}`,
    image,
  });
}

function Stars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <PiStarFill key={i} size={size} className={i <= Math.round(value) ? "text-sun" : "text-line"} />
      ))}
    </span>
  );
}

async function Reviews({ productId, productName }: { productId: string; productName: string }) {
  const reviews = await getProductReviews(productId);
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="container-x mt-28 grid gap-12 border-t border-line pt-16 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="eyebrow">From our customers</p>
        <h2 id="reviews-title" className="display-lg mt-2">Reviews</h2>
        {reviews.length > 0 ? (
          <p className="mt-3 flex items-center gap-2 text-lg font-bold">
            <Stars value={average} size={24} /> {average.toFixed(1)} · {reviews.length} review{reviews.length > 1 ? "s" : ""}
          </p>
        ) : (
          <p className="mt-3 text-ink-soft">Be the first to review {productName}.</p>
        )}
        <div className="mt-6">
          <ReviewForm productId={productId} />
        </div>
      </div>
      <ul className="grid content-start gap-3">
        {reviews.map((review) => (
          <li key={review.id} className="border-b border-line pb-6">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-sand font-display text-lg">{review.author_name.charAt(0).toUpperCase()}</span>
                <span>
                  <span className="block font-bold">{review.author_name}</span>
                  <span className="text-xs text-ink-soft">{formatDate(review.created_at)}</span>
                </span>
              </span>
              <Stars value={review.rating} />
            </div>
            <p className="mt-3 text-ink-soft">{review.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="container-x grid gap-8 pt-8 lg:grid-cols-2">
          <div className="skeleton aspect-[4/5] rounded-[2rem]" />
          <div className="grid content-start gap-3">
            <div className="skeleton h-12 w-3/4" />
            <div className="skeleton h-6 w-1/2" />
            <div className="skeleton mt-6 h-14 w-full" />
          </div>
        </div>
      }
    >
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: PageProps<"/products/[slug]">["params"] }) {
  const { slug } = await params;
  const { products, settings } = await getStorefront();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const related = products
    .filter((p) => p.id !== product.id && (p.categoryId === product.categoryId || p.badges.some((b) => product.badges.includes(b))))
    .sort((a, b) => Number(b.categoryId === product.categoryId) - Number(a.categoryId === product.categoryId))
    .slice(0, 4);

  const details = [
    { title: "About this product", body: product.description, open: true },
    { title: "Ingredients", body: product.ingredients },
    { title: "How to use", body: product.howToUse },
  ].filter((d) => d.body);

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          ...(product.categorySlug ? [{ name: product.categoryName ?? "Shop", path: `/category/${product.categorySlug}` }] : []),
          { name: product.name, path: `/products/${product.slug}` },
        ])}
      />

      <div className="container-x pt-4 md:pt-8">
        <nav aria-label="Breadcrumb" className="mb-6 truncate text-sm text-ink-soft">
          <Link href="/" className="hover:text-ink">Home</Link> /{" "}
          {product.categorySlug && (
            <>
              <Link href={`/category/${product.categorySlug}`} className="hover:text-ink">{product.categoryName}</Link> /{" "}
            </>
          )}
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <ProductGallery name={product.name} images={product.images} art={product.art} />

          <div>
            {product.categoryName && (
              <Link href={`/category/${product.categorySlug}`} className="eyebrow hover:underline">
                {product.categoryName}
              </Link>
            )}
            <h1 className="mt-3 font-display text-4xl md:text-[3.25rem]">{product.name}</h1>
            {product.nameAr && (
              <p className="arabic mt-2 text-xl text-ink-soft" dir="rtl" lang="ar">{product.nameAr}</p>
            )}
            {product.rating.count > 0 && (
              <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm font-bold hover:underline">
                <Stars value={product.rating.average} /> {product.rating.average.toFixed(1)} ({product.rating.count})
              </a>
            )}
            {product.tagline && <p className="serif-italic mt-4 text-xl text-ink-soft">{product.tagline}</p>}

            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-y border-line py-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              {product.badges.map((badge) => (
                <li key={badge} className="flex items-center gap-1.5">
                  <PiCheck className="text-leaf" aria-hidden="true" /> {BADGES[badge].label}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <ProductPurchase
                productId={product.id}
                name={product.name}
                variants={product.variants}
                freeThreshold={settings.free_delivery_threshold_cents}
              />
            </div>

            <div className="mt-10 divide-y divide-line border-y border-line">
              {details.map((detail) => (
                <details key={detail.title} open={detail.open} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-5 font-display text-xl [&::-webkit-details-marker]:hidden">
                    {detail.title}
                    <span className="text-2xl font-light text-ink-soft transition-transform duration-300 group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="whitespace-pre-line pb-6 leading-relaxed text-ink-soft">{detail.body}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <Reviews productId={product.id} productName={product.name} />
      </Suspense>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-x mt-28">
          <p className="eyebrow">Pairs well with</p>
          <h2 id="related-title" className="display-lg mt-3">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={toCardProduct(p)} lowStockThreshold={settings.low_stock_threshold} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
