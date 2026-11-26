import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PiStarFill } from "react-icons/pi";
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
    <section id="reviews" aria-labelledby="reviews-title" className="container-x mt-20 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="eyebrow">Real people, real food</p>
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
          <li key={review.id} className="rounded-[1.5rem] bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-butter font-bold">{review.author_name.charAt(0).toUpperCase()}</span>
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
        <nav aria-label="Breadcrumb" className="mb-4 truncate text-sm font-semibold text-ink-soft">
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
            <h1 className="mt-2 font-display text-4xl font-extrabold md:text-5xl">{product.name}</h1>
            {product.nameAr && (
              <p className="arabic mt-1 text-2xl text-brown" dir="rtl" lang="ar">{product.nameAr}</p>
            )}
            {product.rating.count > 0 && (
              <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm font-bold hover:underline">
                <Stars value={product.rating.average} /> {product.rating.average.toFixed(1)} ({product.rating.count})
              </a>
            )}
            {product.tagline && <p className="mt-3 text-lg text-ink-soft">{product.tagline}</p>}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {product.badges.map((badge) => (
                <span key={badge} className="chip" style={{ color: BADGES[badge].color, background: BADGES[badge].bg }}>
                  {BADGES[badge].emoji} {BADGES[badge].label}
                </span>
              ))}
            </div>

            <div className="mt-6">
              <ProductPurchase
                productId={product.id}
                name={product.name}
                variants={product.variants}
                freeThreshold={settings.free_delivery_threshold_cents}
              />
            </div>

            <div className="mt-8 divide-y divide-line rounded-[1.5rem] border border-line bg-paper">
              {details.map((detail) => (
                <details key={detail.title} open={detail.open} className="group px-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-display text-lg font-extrabold [&::-webkit-details-marker]:hidden">
                    {detail.title}
                    <span className="grid size-8 place-items-center rounded-full bg-cream text-xl transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="whitespace-pre-line pb-5 text-ink-soft">{detail.body}</p>
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
        <section aria-labelledby="related-title" className="container-x mt-20">
          <h2 id="related-title" className="display-lg">You might also love</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={toCardProduct(p)} lowStockThreshold={settings.low_stock_threshold} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
