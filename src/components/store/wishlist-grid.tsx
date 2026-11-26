"use client";

import Link from "next/link";
import { PiHeart } from "react-icons/pi";
import ProductCard, { type CardProduct } from "@/components/store/product-card";
import { useWishlist } from "@/lib/cart";

export default function WishlistGrid({ products, lowStockThreshold }: { products: CardProduct[]; lowStockThreshold: number }) {
  const { ids, ready } = useWishlist();
  const saved = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is CardProduct => Boolean(p));

  if (!ready) return <div className="skeleton mt-8 h-64" />;

  if (saved.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-line bg-paper p-12 text-center">
        <PiHeart size={32} className="mx-auto text-ink-soft" aria-hidden="true" />
        <h2 className="mt-4 text-2xl">Nothing saved yet</h2>
        <p className="mt-1 text-ink-soft">Tap the heart on any product to save it for later.</p>
        <Link href="/shop" className="btn btn-primary mt-6">Discover products</Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {saved.map((product) => (
        <ProductCard key={product.id} product={product} lowStockThreshold={lowStockThreshold} />
      ))}
    </div>
  );
}
