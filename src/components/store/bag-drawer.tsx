"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { PiCheckBold, PiPlusBold, PiShoppingBagOpenBold, PiTrashBold, PiTruckBold, PiXBold } from "react-icons/pi";
import ProductVisual from "@/components/product-visual";
import Drawer from "@/components/store/drawer";
import QuantityStepper from "@/components/store/quantity-stepper";
import { useI18n } from "@/components/i18n-provider";
import { useStore } from "@/components/store/store-provider";
import { BAG_ADDED_EVENT, OPEN_BAG_EVENT, addToCart, removeFromCart, setCartQuantity, useCart } from "@/lib/cart";
import { money, shortMoney } from "@/lib/format";

export function useBagLines() {
  const { items, ready } = useCart();
  const { variantIndex } = useStore();

  return useMemo(() => {
    const lines = items.flatMap((item) => {
      const entry = variantIndex.get(item.variantId);
      if (!entry) return [];
      return [{ ...entry, quantity: item.quantity }];
    });
    const subtotal = lines.reduce((sum, line) => sum + line.variant.price * line.quantity, 0);
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    return { lines, subtotal, count, ready };
  }, [items, ready, variantIndex]);
}

export function FreeDeliveryMeter({ subtotal }: { subtotal: number }) {
  const { settings } = useStore();
  const { t } = useI18n();
  const threshold = settings.free_delivery_threshold_cents;
  if (!threshold) return null;
  const progress = Math.min(1, subtotal / threshold);
  const remaining = threshold - subtotal;

  return (
    <div className="rounded-2xl bg-mint p-3.5">
      <p className="flex items-center gap-2 text-sm font-bold text-leaf-dark">
        <PiTruckBold size={18} aria-hidden="true" />
        {remaining > 0 ? t.bag.freeDeliveryLeft(money(remaining)) : t.bag.freeDelivery}
      </p>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="h-full rounded-full bg-gradient-to-r from-lime to-leaf transition-[width] duration-700 ease-out rtl:bg-gradient-to-l" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

/** Close the drawer when the visitor goes to another page. */
function CloseOnNavigate({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const callback = useRef(onNavigate);
  useEffect(() => {
    callback.current = onNavigate;
  });
  useEffect(() => {
    callback.current();
  }, [pathname]);
  return null;
}

export default function BagDrawer() {
  const { t, href } = useI18n();
  const { products } = useStore();
  const { lines, subtotal, count } = useBagLines();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const show = () => setOpen(true);
    let timer = 0;
    const added = () => {
      setToast(t.common.addedToBag);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setToast(null), 2200);
    };
    window.addEventListener(OPEN_BAG_EVENT, show);
    window.addEventListener(BAG_ADDED_EVENT, added);
    return () => {
      window.removeEventListener(OPEN_BAG_EVENT, show);
      window.removeEventListener(BAG_ADDED_EVENT, added);
      window.clearTimeout(timer);
    };
  }, [t]);

  const inBag = new Set(lines.map((line) => line.product.id));
  const suggestions = products.filter((p) => !inBag.has(p.id) && p.image && p.variants.some((v) => v.stock > 0)).slice(0, 3);

  return (
    <>
      <Suspense fallback={null}>
        <CloseOnNavigate onNavigate={() => setOpen(false)} />
      </Suspense>

      <Drawer open={open} onClose={() => setOpen(false)} label={t.bag.title}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-baseline gap-2 text-2xl">
            {t.bag.title} <span className="font-sans text-sm font-bold text-ink-soft">({count})</span>
          </h2>
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label={t.common.close}>
            <PiXBold size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4" data-lenis-prevent>
          {lines.length === 0 ? (
            <div className="grid place-items-center py-14 text-center">
              <div className="grid size-20 place-items-center rounded-full bg-butter text-tomato">
                <PiShoppingBagOpenBold size={32} aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-2xl">{t.bag.empty}</h3>
              <p className="mt-1 text-ink-soft">{t.bag.emptyText}</p>
              <Link href={href("/shop")} className="btn btn-primary mt-6" onClick={() => setOpen(false)}>
                {t.bag.startShopping}
              </Link>
            </div>
          ) : (
            <>
              <FreeDeliveryMeter subtotal={subtotal} />
              <ul className="mt-4 grid gap-4">
                {lines.map(({ product, variant, quantity }) => (
                  <li key={variant.id} className="flex gap-3.5 border-b border-line pb-4">
                    <Link href={href(`/products/${product.slug}`)} className="relative block size-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                      <ProductVisual image={product.image} alt={product.name} art={product.art} sizes="80px" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={href(`/products/${product.slug}`)} className="block truncate font-bold leading-tight">
                            {product.name}
                          </Link>
                          <span className="text-sm text-ink-soft">{variant.label}</span>
                        </div>
                        <button type="button" className="icon-btn size-9 shrink-0 text-ink-soft hover:text-tomato" onClick={() => removeFromCart(variant.id)} aria-label={t.bag.removeItem(product.name)}>
                          <PiTrashBold size={18} />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                        <QuantityStepper value={quantity} max={Math.min(variant.stock, 99)} onChange={(next) => setCartQuantity(variant.id, next)} size="sm" allowZero label={`${product.name} ${variant.label}`} />
                        <span className="font-bold tabular-nums">{money(variant.price * quantity)}</span>
                      </div>
                      {quantity > variant.stock && <p className="mt-1 text-xs font-bold text-tomato">{t.bag.onlyAvailable(variant.stock)}</p>}
                    </div>
                  </li>
                ))}
              </ul>

              {suggestions.length > 0 && (
                <div className="mt-6">
                  <p className="eyebrow mb-3">{t.bag.goesWell}</p>
                  <ul className="grid gap-2">
                    {suggestions.map((product) => {
                      const variant = product.variants.find((v) => v.stock > 0)!;
                      return (
                        <li key={product.id} className="flex items-center gap-3 rounded-2xl bg-paper p-2 shadow-soft">
                          <span className="relative block size-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                            <ProductVisual image={product.image} alt={product.name} art={product.art} sizes="48px" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">{product.name}</span>
                            <span className="text-xs text-ink-soft">
                              {variant.label} · {shortMoney(variant.price)}
                            </span>
                          </span>
                          <button
                            type="button"
                            className="btn btn-soft btn-sm"
                            onClick={() => {
                              try {
                                addToCart(variant.id, 1, variant.stock);
                              } catch {
                                /* already at the limit */
                              }
                            }}
                          >
                            <PiPlusBold size={13} /> {t.bag.add}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {lines.length > 0 && (
          <div className="safe-bottom border-t border-line bg-paper px-5 pb-5 pt-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>{t.common.subtotal}</span>
              <span className="tabular-nums">{money(subtotal)}</span>
            </div>
            <p className="mb-3 text-sm text-ink-soft">{t.bag.deliveryAtCheckout}</p>
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <Link href={href("/bag")} className="btn btn-soft" onClick={() => setOpen(false)}>
                {t.bag.viewBag}
              </Link>
              <Link href={href("/checkout")} className="btn btn-primary" onClick={() => setOpen(false)}>
                {t.bag.checkout} · {money(subtotal)}
              </Link>
            </div>
          </div>
        )}
      </Drawer>

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 top-20 z-[65] flex justify-center px-4 transition-all duration-300 ${toast ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"}`}
      >
        {toast && (
          <button type="button" onClick={() => setOpen(true)} className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-ink py-2.5 ps-3 pe-5 text-sm font-bold text-cream shadow-pop">
            <span className="grid size-6 place-items-center rounded-full bg-lime text-ink">
              <PiCheckBold size={13} aria-hidden="true" />
            </span>
            {toast}
            <span className="text-sun underline underline-offset-2">{t.bag.viewBag}</span>
          </button>
        )}
      </div>
    </>
  );
}
