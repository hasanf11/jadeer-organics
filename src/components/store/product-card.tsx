"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PiCheckBold, PiHeartBold, PiHeartFill, PiPlusBold, PiStarFill } from "react-icons/pi";
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

  return (
    <article className="group relative flex h-full flex-col">
      <div
        className="relative overflow-hidden rounded-[1.6rem] transition-shadow duration-300 group-hover:shadow-pop"
        style={{ background: product.art.background }}
      >
        <Link href={`/products/${product.slug}`} aria-label={product.name} className="block">
          <div ref={imageRef} className="relative aspect-[4/5] overflow-hidden">
            <ProductVisual
              image={product.image}
              alt={product.name}
              art={product.art}
              priority={priority}
              className="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          </div>
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {soldOut && <span className="chip bg-ink text-cream">Sold out</span>}
          {!soldOut && onSale && <span className="chip bg-tomato text-white">Sale</span>}
          {lowStock && <span className="chip bg-sun text-ink">Only {totalStock} left</span>}
          {product.badges.includes("keto") && <span className="chip bg-teal text-white">Keto</span>}
        </div>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className={`absolute right-2.5 top-2.5 grid size-10 place-items-center rounded-full bg-white/90 shadow-soft backdrop-blur transition-transform hover:scale-110 active:scale-90 ${
            saved ? "text-berry" : "text-ink"
          }`}
        >
          {saved ? <PiHeartFill size={20} className="animate-pop" /> : <PiHeartBold size={20} />}
        </button>

        {!soldOut && (
          <div className="absolute inset-x-2.5 bottom-2.5">
            {choosing ? (
              <div className="animate-pop rounded-2xl bg-white/95 p-2 shadow-pop backdrop-blur" role="group" aria-label="Choose a size">
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={variant.stock < 1}
                      onClick={() => add(variant.id, variant.stock)}
                      className="flex-1 rounded-xl border-2 border-line px-2 py-1.5 text-sm font-bold transition-colors hover:border-leaf hover:bg-mint disabled:opacity-40"
                    >
                      {variant.label}
                      <span className="block text-xs font-semibold text-ink-soft">{shortMoney(variant.price)}</span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setChoosing(false)} className="mt-1 w-full text-xs font-bold text-ink-soft">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => (inStock.length === 1 && product.variants.length === 1 ? add(inStock[0].id, inStock[0].stock) : setChoosing(true))}
                className={`ml-auto flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold shadow-soft transition-all duration-300 hover:scale-105 active:scale-95 ${
                  added ? "bg-leaf text-white" : "bg-white text-ink"
                }`}
                aria-label={`Add ${product.name} to bag`}
              >
                {added ? <PiCheckBold size={18} /> : <PiPlusBold size={18} />}
                <span>{added ? "Added" : "Add"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-tomato/10 px-3 py-1.5 text-xs font-bold text-tomato">
          {error}
        </p>
      )}

      <div className="flex flex-1 flex-col px-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-sans text-[1.02rem] font-bold leading-snug tracking-normal">
            <Link href={`/products/${product.slug}`} className="hover:text-leaf">
              {product.name}
            </Link>
          </h3>
          {product.rating && product.rating.count > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-sm font-bold">
              <PiStarFill className="text-sun" /> {product.rating.average.toFixed(1)}
            </span>
          )}
        </div>
        {product.nameAr && (
          <p className="arabic text-left text-sm text-ink-soft" dir="rtl" lang="ar">
            {product.nameAr}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {product.badges
            .filter((b) => b !== "keto" && b !== "bestseller")
            .slice(0, 2)
            .map((badge) => (
              <span key={badge} className="chip px-2 py-0.5 text-[0.68rem]" style={{ color: BADGES[badge].color, background: BADGES[badge].bg }}>
                {BADGES[badge].label}
              </span>
            ))}
        </div>
        <p className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-extrabold text-ink">
            {product.variants.length > 1 && <span className="text-sm font-semibold text-ink-soft">from </span>}
            {shortMoney(cheapest.price)}
          </span>
          {cheapest.compareAt && cheapest.compareAt > cheapest.price && (
            <span className="text-sm text-ink-soft line-through">{shortMoney(cheapest.compareAt)}</span>
          )}
        </p>
      </div>
    </article>
  );
}
