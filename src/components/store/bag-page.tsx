"use client";

import Link from "next/link";
import { PiArrowRightBold, PiTrashBold } from "react-icons/pi";
import ProductVisual from "@/components/product-visual";
import QuantityStepper from "@/components/store/quantity-stepper";
import { FreeDeliveryMeter, useBagLines } from "@/components/store/bag-drawer";
import { clearCart, removeFromCart, setCartQuantity } from "@/lib/cart";
import { money } from "@/lib/format";

export default function BagPage() {
  const { lines, subtotal, count, ready } = useBagLines();

  if (!ready) return <div className="skeleton h-64" />;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto grid size-28 place-items-center rounded-full bg-butter text-6xl">🧺</div>
        <h1 className="mt-5 text-3xl">Your bag is empty</h1>
        <p className="mt-2 text-ink-soft">Fill it with something good for you.</p>
        <Link href="/shop" className="btn btn-primary mt-6">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <div>
        <div className="flex items-end justify-between gap-4">
          <h1 className="display-lg">Your bag <span className="text-leaf">({count})</span></h1>
          <button type="button" onClick={() => clearCart()} className="text-sm font-bold text-ink-soft hover:text-tomato">
            Empty bag
          </button>
        </div>
        <ul className="mt-6 grid gap-3">
          {lines.map(({ product, variant, quantity }) => (
            <li key={variant.id} className="flex gap-4 rounded-[1.5rem] bg-white p-3 md:p-4">
              <Link href={`/products/${product.slug}`} className="relative block size-24 shrink-0 overflow-hidden rounded-2xl md:size-28">
                <ProductVisual image={product.image} alt={product.name} art={product.art} sizes="112px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/products/${product.slug}`} className="block font-bold hover:text-leaf">{product.name}</Link>
                    <p className="text-sm text-ink-soft">{variant.label} · {money(variant.price)} each</p>
                  </div>
                  <button type="button" onClick={() => removeFromCart(variant.id)} className="icon-btn size-10 shrink-0 text-ink-soft hover:text-tomato" aria-label={`Remove ${product.name}`}>
                    <PiTrashBold size={19} />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <QuantityStepper value={quantity} max={Math.min(99, variant.stock)} onChange={(q) => setCartQuantity(variant.id, q)} allowZero label={product.name} />
                  <span className="text-lg font-bold tabular-nums">{money(variant.price * quantity)}</span>
                </div>
                {quantity > variant.stock && <p className="mt-1 text-sm font-bold text-tomato">Only {variant.stock} available.</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="card sticky top-28 grid gap-4 p-6">
        <h2 className="text-2xl">Summary</h2>
        <FreeDeliveryMeter subtotal={subtotal} />
        <div className="flex items-baseline justify-between">
          <span className="font-bold">Subtotal</span>
          <span className="font-display text-3xl font-extrabold">{money(subtotal)}</span>
        </div>
        <p className="text-sm text-ink-soft">Delivery fee is added at checkout based on your area. Pay cash on delivery.</p>
        <Link href="/checkout" className="btn btn-primary w-full text-lg">
          Checkout <PiArrowRightBold />
        </Link>
        <Link href="/shop" className="btn btn-soft w-full">Continue shopping</Link>
      </aside>
    </div>
  );
}
