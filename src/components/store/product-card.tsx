"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PiCheckBold, PiHeart, PiHeartFill, PiPlusBold, PiStarFill } from "react-icons/pi";
import ProductVisual from "@/components/product-visual";
import { BADGES } from "@/lib/badges";
import { addToCart, toggleWishlist, useWishlist } from "@/lib/cart";
import { flyToBag } from "@/lib/fly-to-bag";
import { shortMoney } from "@/lib/format";
import type { ArtShape, BadgeKey } from "@/lib/badges";

export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  tagline?: string;
  badges: BadgeKey[];
  art: { shape: ArtShape; color: string; background: string };
  image: string | null;
  category: string | null;
  variants: { id: string; label: string; price: number; compareAt: number | null; stock: number }[];
  rating?: { average: number; count: number };
};

export default function ProductCard({
  product,
  priority = false,
  lowStockThreshold = 5,
}: {
  product: CardProduct;
  priority?: boolean;
  lowStockThreshold?: number;
}) {
  const imageRef = useRef<HTMLDivElement>(null);
  const { ids } = useWishlist();
  const saved = ids.includes(product.id);
  const [choosing, setChoosing] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inStock = product.variants.filter((v) => v.stock > 0);
  const soldOut = inStock.length === 0;
  const cheapest = product.variants.reduce((min, v) => (v.price < min.price ? v : min), product.variants[0]);
  const onSale = product.variants.some((v) => v.compareAt && v.compareAt > v.price);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const lowStock = !soldOut && totalStock <= lowStockThreshold;
  const tag = soldOut ? "Sold out" : onSale ? "Sale" : lowStock ? `Only ${totalStock} left` : product.badges.includes("bestseller") ? "Bestseller" : product.badges.includes("new") ? "New" : null;

  function add(variantId: string, stock: number) {
    try {
      addToCart(variantId, 1, stock);
      flyToBag(imageRef.current);
      setAdded(true);
      setChoosing(false);
      setError(null);
      window.setTimeout(() => setAdded(false), 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add to bag.");
      window.setTimeout(() => setError(null), 2500);
    }
  }

  const labels = product.badges.filter((b) => b !== "bestseller" && b !== "new").slice(0, 2);

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative overflow-hidden rounded-2xl bg-sand">
        <Link href={`/products/${product.slug}`} aria-label={product.name} className="block">
          <div ref={imageRef} className="relative aspect-[4/5] overflow-hidden">
            <ProductVisual
              image={product.image}
              alt={product.name}
              art={product.art}
              priority={priority}
              className="transition-transform duration-[1.2s] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.04]"
            />
          </div>
        </Link>

        {tag && (
          <span className={`pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] ${soldOut ? "bg-ink text-cream" : onSale ? "bg-tomato text-white" : "bg-paper/95 text-ink"}`}>
            {tag}
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className={`absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-paper/95 transition-colors hover:bg-white ${saved ? "text-tomato" : "text-ink"}`}
        >
          {saved ? <PiHeartFill size={17} className="animate-pop" /> : <PiHeart size={17} />}
        </button>

        {!soldOut && (
          <div className="absolute inset-x-3 bottom-3">
            {choosing ? (
              <div className="animate-pop rounded-xl bg-paper p-2 shadow-pop" role="group" aria-label="Choose a size">
                <p className="px-1 pb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">Choose a size</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={variant.stock < 1}
                      onClick={() => add(variant.id, variant.stock)}
                      className="flex-1 rounded-lg border border-line px-2 py-1.5 text-sm font-semibold transition-colors hover:border-ink disabled:opacity-40"
                    >
                      {variant.label}
                      <span className="block text-xs font-medium text-ink-soft">{shortMoney(variant.price)}</span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setChoosing(false)} className="mt-1 w-full py-1 text-xs font-semibold text-ink-soft hover:text-ink">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => (inStock.length === 1 && product.variants.length === 1 ? add(inStock[0].id, inStock[0].stock) : setChoosing(true))}
                className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-all duration-300 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100 ${
                  added ? "bg-leaf text-white !opacity-100 !translate-y-0" : "bg-paper/95 text-ink hover:bg-ink hover:text-cream"
                }`}
                aria-label={`Add ${product.name} to bag`}
              >
                {added ? <PiCheckBold size={15} /> : <PiPlusBold size={15} />}
                <span>{added ? "Added to bag" : "Add to bag"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-tomato/10 px-3 py-1.5 text-xs font-semibold text-tomato">
          {error}
        </p>
      )}

      <div className="flex flex-1 flex-col pt-3.5">
        {labels.length > 0 && (
          <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            {labels.map((b) => BADGES[b].label).join(" · ")}
          </p>
        )}
        <h3 className="font-display text-[1.15rem] leading-snug">
          <Link href={`/products/${product.slug}`} className="transition-colors hover:text-leaf">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-baseline justify-between gap-2 pt-1.5">
          <p className="flex items-baseline gap-2">
            <span className="font-semibold text-ink">
              {product.variants.length > 1 && <span className="text-sm font-normal text-ink-soft">From </span>}
              {shortMoney(cheapest.price)}
            </span>
            {cheapest.compareAt && cheapest.compareAt > cheapest.price && (
              <span className="text-sm text-ink-soft line-through">{shortMoney(cheapest.compareAt)}</span>
            )}
          </p>
          {product.rating && product.rating.count > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
              <PiStarFill className="text-sun" /> {product.rating.average.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
