"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PiCheckBold, PiHeart, PiHeartFill, PiPlusBold, PiStarFill } from "react-icons/pi";
import ProductVisual from "@/components/product-visual";
import { useI18n } from "@/components/i18n-provider";
import { addToCart, cartErrorMessage, toggleWishlist, useWishlist } from "@/lib/cart";
import { flyToBag } from "@/lib/fly-to-bag";
import { shortMoney } from "@/lib/format";
import type { ArtShape, BadgeKey } from "@/lib/badges";

export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
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
  const { t, href } = useI18n();
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
  const tag = soldOut
    ? { text: t.common.soldOut, cls: "bg-ink text-cream" }
    : onSale
      ? { text: t.common.sale, cls: "bg-tomato text-white" }
      : lowStock
        ? { text: t.common.onlyLeft(totalStock), cls: "bg-sun text-ink" }
        : product.badges.includes("bestseller")
          ? { text: t.common.bestseller, cls: "bg-leaf text-white" }
          : product.badges.includes("new")
            ? { text: t.common.new, cls: "bg-berry text-white" }
            : null;

  function add(variantId: string, stock: number) {
    try {
      addToCart(variantId, 1, stock);
      flyToBag(imageRef.current);
      setAdded(true);
      setChoosing(false);
      setError(null);
      window.setTimeout(() => setAdded(false), 1400);
    } catch (e) {
      setError(cartErrorMessage(e, t.cartErrors));
      window.setTimeout(() => setError(null), 2800);
    }
  }

  const labels = product.badges.filter((b) => b !== "bestseller" && b !== "new").slice(0, 2);
  const url = href(`/products/${product.slug}`);

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative overflow-hidden rounded-[1.4rem]" style={{ background: product.art.background }}>
        <Link href={url} aria-label={product.name} className="block">
          <div ref={imageRef} className="relative aspect-[4/5] overflow-hidden">
            <ProductVisual
              image={product.image}
              alt={product.name}
              art={product.art}
              priority={priority}
              className="transition-transform duration-[1.1s] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.05]"
            />
          </div>
        </Link>

        {tag && (
          <span className={`pointer-events-none absolute start-2.5 top-2.5 rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold en:uppercase en:tracking-[0.06em] ${tag.cls}`}>
            {tag.text}
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={saved}
          aria-label={saved ? t.common.removeFromWishlist(product.name) : t.common.saveToWishlist(product.name)}
          className={`absolute end-2.5 top-2.5 grid size-9 place-items-center rounded-full bg-white/95 shadow-soft transition-transform hover:scale-110 active:scale-95 ${saved ? "text-berry" : "text-ink"}`}
        >
          {saved ? <PiHeartFill size={17} className="animate-pop" /> : <PiHeart size={17} />}
        </button>

        {!soldOut && (
          <div className="absolute inset-x-2.5 bottom-2.5">
            {choosing ? (
              <div className="animate-pop rounded-2xl bg-paper p-2 shadow-pop" role="group" aria-label={t.common.chooseSize}>
                <p className="px-1 pb-1.5 text-[0.7rem] font-extrabold text-ink-soft en:uppercase en:tracking-[0.1em]">{t.common.chooseSize}</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={variant.stock < 1}
                      onClick={() => add(variant.id, variant.stock)}
                      className="min-h-11 flex-1 rounded-xl bg-white px-2 py-1.5 text-sm font-bold shadow-[inset_0_0_0_1.5px_var(--color-line)] transition-shadow hover:shadow-[inset_0_0_0_1.5px_var(--color-leaf)] disabled:opacity-40"
                    >
                      {variant.label}
                      <span className="block text-xs font-semibold text-ink-soft">{shortMoney(variant.price)}</span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setChoosing(false)} className="mt-1 w-full py-1.5 text-xs font-bold text-ink-soft hover:text-ink">
                  {t.common.cancel}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => (inStock.length === 1 && product.variants.length === 1 ? add(inStock[0].id, inStock[0].stock) : setChoosing(true))}
                className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[0.82rem] font-bold shadow-soft transition-all duration-300 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100 ${
                  added ? "bg-leaf text-white lg:translate-y-0 lg:opacity-100" : "bg-white/95 text-ink hover:bg-leaf hover:text-white"
                }`}
                aria-label={`${t.common.addToBag}: ${product.name}`}
              >
                {added ? <PiCheckBold size={15} /> : <PiPlusBold size={15} />}
                <span>{added ? t.common.added : t.common.addToBag}</span>
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

      <div className="flex flex-1 flex-col pt-3">
        {labels.length > 0 && (
          <p className="mb-1 text-[0.68rem] font-extrabold text-leaf en:uppercase en:tracking-[0.1em]">
            {labels.map((b) => t.badges[b]).join(" · ")}
          </p>
        )}
        <h3 className="font-display text-[1.12rem] leading-snug ar:text-[1.05rem]">
          <Link href={url} className="transition-colors hover:text-tomato">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-baseline justify-between gap-2 pt-1.5">
          <p className="flex items-baseline gap-2">
            <span className="font-extrabold text-ink">
              {product.variants.length > 1 && <span className="text-xs font-semibold text-ink-soft">{t.common.from} </span>}
              {shortMoney(cheapest.price)}
            </span>
            {cheapest.compareAt && cheapest.compareAt > cheapest.price && (
              <span className="text-sm text-ink-soft line-through">{shortMoney(cheapest.compareAt)}</span>
            )}
          </p>
          {product.rating && product.rating.count > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-ink-soft">
              <PiStarFill className="text-sun" aria-hidden="true" /> {product.rating.average.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
