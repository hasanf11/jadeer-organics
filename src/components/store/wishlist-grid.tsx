"use client";

import Link from "next/link";
import ProductCard, { type CardProduct } from "@/components/store/product-card";
import { useWishlist } from "@/lib/cart";

export default function WishlistGrid({ products, lowStockThreshold }: { products: CardProduct[]; lowStockThreshold: number }) {
  const { ids, ready } = useWishlist();
  const saved = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is CardProduct => Boolean(p));

  if (!ready) return <div className="skeleton mt-8 h-64" />;

  if (saved.length === 0) {
    return (
      <div className="mt-8 rounded-[2rem] bg-white p-10 text-center">
        <p className="text-6xl">🤍</p>
        <h2 className="mt-4 text-2xl">Nothing saved yet</h2>
        <p className="mt-1 text-ink-soft">Tap the heart on any product to save it for later.</p>
        <Link href="/shop" className="btn btn-primary mt-6">Discover products</Link>
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
