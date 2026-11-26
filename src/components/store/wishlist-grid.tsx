"use client";

import Link from "next/link";
import { PiHeartBold } from "react-icons/pi";
import ProductCard, { type CardProduct } from "@/components/store/product-card";
import { useI18n } from "@/components/i18n-provider";
import { useWishlist } from "@/lib/cart";

export default function WishlistGrid({ products, lowStockThreshold }: { products: CardProduct[]; lowStockThreshold: number }) {
  const { t, href } = useI18n();
  const { ids, ready } = useWishlist();
  const saved = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is CardProduct => Boolean(p));

  if (!ready) return <div className="skeleton mt-8 h-64" />;

  if (saved.length === 0) {
    return (
      <div className="mt-8 rounded-3xl bg-blush p-12 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-white text-berry">
          <PiHeartBold size={28} aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-2xl">{t.wishlist.empty}</h2>
        <p className="mt-1 text-ink-soft">{t.wishlist.emptyText}</p>
        <Link href={href("/shop")} className="btn btn-primary mt-6">{t.wishlist.discover}</Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
      {saved.map((product) => (
        <ProductCard key={product.id} product={product} lowStockThreshold={lowStockThreshold} />
      ))}
    </div>
  );
}
