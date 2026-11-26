"use client";

import Link from "next/link";
import { PiArrowLeftBold, PiArrowRightBold, PiShoppingBagOpenBold, PiTrashBold } from "react-icons/pi";
import ProductVisual from "@/components/product-visual";
import QuantityStepper from "@/components/store/quantity-stepper";
import { FreeDeliveryMeter, useBagLines } from "@/components/store/bag-drawer";
import { useI18n } from "@/components/i18n-provider";
import { clearCart, removeFromCart, setCartQuantity } from "@/lib/cart";
import { money } from "@/lib/format";

export default function BagPage() {
  const { t, href, rtl } = useI18n();
  const { lines, subtotal, count, ready } = useBagLines();
  const Arrow = rtl ? PiArrowLeftBold : PiArrowRightBold;

  if (!ready) return <div className="skeleton h-64" />;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-butter text-tomato">
          <PiShoppingBagOpenBold size={32} aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl">{t.bag.empty}</h1>
        <p className="mt-2 text-ink-soft">{t.bag.emptyText}</p>
        <Link href={href("/shop")} className="btn btn-primary mt-6">{t.bag.startShopping}</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="display-lg">
            {t.bag.title} <span className="font-sans text-lg font-bold text-ink-soft">({t.common.items(count)})</span>
          </h1>
          <button type="button" onClick={() => clearCart()} className="text-sm font-bold text-ink-soft hover:text-tomato">
            {t.bag.emptyBag}
          </button>
        </div>
        <ul className="mt-6 grid gap-5">
          {lines.map(({ product, variant, quantity }) => (
            <li key={variant.id} className="flex gap-4 border-b border-line pb-5">
              <Link href={href(`/products/${product.slug}`)} className="relative block size-24 shrink-0 overflow-hidden rounded-2xl bg-sand md:size-28">
                <ProductVisual image={product.image} alt={product.name} art={product.art} sizes="112px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={href(`/products/${product.slug}`)} className="block font-bold hover:text-tomato">{product.name}</Link>
                    <p className="text-sm text-ink-soft">{variant.label} · {money(variant.price)} {t.bag.each}</p>
                  </div>
                  <button type="button" onClick={() => removeFromCart(variant.id)} className="icon-btn size-10 shrink-0 text-ink-soft hover:text-tomato" aria-label={t.bag.removeItem(product.name)}>
                    <PiTrashBold size={19} />
                  </button>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                  <QuantityStepper value={quantity} max={Math.min(99, variant.stock)} onChange={(q) => setCartQuantity(variant.id, q)} allowZero label={product.name} />
                  <span className="text-lg font-bold tabular-nums">{money(variant.price * quantity)}</span>
                </div>
                {quantity > variant.stock && <p className="mt-1 text-sm font-bold text-tomato">{t.bag.onlyAvailable(variant.stock)}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="card grid gap-4 p-6 lg:sticky lg:top-28">
        <h2 className="text-2xl">{t.bag.summary}</h2>
        <FreeDeliveryMeter subtotal={subtotal} />
        <div className="flex items-baseline justify-between">
          <span className="font-bold">{t.common.subtotal}</span>
          <span className="font-display text-3xl">{money(subtotal)}</span>
        </div>
        <p className="text-sm text-ink-soft">{t.bag.deliveryAdded}</p>
        <Link href={href("/checkout")} className="btn btn-primary w-full text-base">
          {t.bag.checkout} <Arrow />
        </Link>
        <Link href={href("/shop")} className="btn btn-soft w-full">{t.bag.continueShopping}</Link>
      </aside>
    </div>
  );
}
