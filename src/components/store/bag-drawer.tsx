"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { PiCheckBold, PiShoppingBagOpenBold, PiTrashBold, PiTruckBold, PiXBold } from "react-icons/pi";
import ProductVisual from "@/components/product-visual";
import QuantityStepper from "@/components/store/quantity-stepper";
import { useStore } from "@/components/store/store-provider";
import {
  BAG_ADDED_EVENT,
  OPEN_BAG_EVENT,
  addToCart,
  removeFromCart,
  setCartQuantity,
  useCart,
} from "@/lib/cart";
import { money, shortMoney } from "@/lib/format";

export function useBagLines() {
  const { items, ready } = useCart();
  const { variantIndex } = useStore();

  return useMemo(() => {
    const lines = items.flatMap((item) => {
      const entry = variantIndex.get(item.variantId);
      if (!entry) return [];
      return [{ ...entry, quantity: item.quantity, available: entry.variant.stock }];
    });
    const missing = items.filter((item) => !variantIndex.has(item.variantId));
    const subtotal = lines.reduce((sum, line) => sum + line.variant.price * line.quantity, 0);
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    return { lines, missing, subtotal, count, ready };
  }, [items, ready, variantIndex]);
}

export function FreeDeliveryMeter({ subtotal }: { subtotal: number }) {
  const { settings } = useStore();
  const threshold = settings.free_delivery_threshold_cents;
  if (!threshold) return null;
  const progress = Math.min(1, subtotal / threshold);
  const remaining = threshold - subtotal;

  return (
    <div className="rounded-xl bg-sand/70 p-3.5">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <PiTruckBold size={18} />
        {remaining > 0 ? (
          <span>
            Add <span className="text-ink">{money(remaining)}</span> for free delivery
          </span>
        ) : (
          <span>Your delivery is free</span>
        )}
      </p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-leaf transition-[width] duration-700 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

/** Close the drawer when the visitor goes to another page. */
function CloseOnNavigate({ dialog }: { dialog: React.RefObject<HTMLDialogElement | null> }) {
  const pathname = usePathname();
  useEffect(() => {
    dialog.current?.close();
  }, [pathname, dialog]);
  return null;
}

export default function BagDrawer() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { products } = useStore();
  const { lines, subtotal, count } = useBagLines();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const open = () => {
      if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
    };
    const added = () => {
      setToast("Added to your bag");
      window.setTimeout(() => setToast(null), 2200);
    };
    window.addEventListener(OPEN_BAG_EVENT, open);
    window.addEventListener(BAG_ADDED_EVENT, added);
    return () => {
      window.removeEventListener(OPEN_BAG_EVENT, open);
      window.removeEventListener(BAG_ADDED_EVENT, added);
    };
  }, []);


  const inBag = new Set(lines.map((line) => line.product.id));
  const suggestions = products
    .filter((p) => !inBag.has(p.id) && p.variants.some((v) => v.stock > 0))
    .slice(0, 12)
    .sort((a, b) => a.name.length - b.name.length)
    .slice(0, 3);

  return (
    <>
      <Suspense fallback={null}>
        <CloseOnNavigate dialog={dialogRef} />
      </Suspense>
      <dialog
        ref={dialogRef}
        aria-label="Your bag"
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-md bg-transparent p-0 open:animate-[slide-in_0.35s_cubic-bezier(0.2,0.9,0.3,1)]"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="flex h-full flex-col bg-cream">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="flex items-baseline gap-2 text-2xl">
              Your bag <span className="font-sans text-sm font-semibold text-ink-soft">({count})</span>
            </h2>
            <button type="button" className="icon-btn" onClick={() => dialogRef.current?.close()} aria-label="Close bag">
              <PiXBold size={22} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4" data-lenis-prevent>
            {lines.length === 0 ? (
              <div className="grid place-items-center py-12 text-center">
                <div className="grid size-20 place-items-center rounded-full bg-sand text-ink-soft"><PiShoppingBagOpenBold size={30} /></div>
                <h3 className="mt-5 text-2xl">Your bag is empty</h3>
                <p className="mt-1 text-ink-soft">Discover our organic pantry essentials.</p>
                <Link href="/shop" className="btn btn-primary mt-6">
                  Start shopping
                </Link>
              </div>
            ) : (
              <>
                <FreeDeliveryMeter subtotal={subtotal} />
                <ul className="mt-4 grid gap-3">
                  {lines.map(({ product, variant, quantity }) => (
                    <li key={variant.id} className="flex gap-3.5 border-b border-line pb-4">
                      <Link
                        href={`/products/${product.slug}`}
                        className="relative block size-20 shrink-0 overflow-hidden rounded-xl"
                      >
                        <ProductVisual image={product.image} alt={product.name} art={product.art} sizes="80px" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={`/products/${product.slug}`} className="block truncate font-bold leading-tight">
                              {product.name}
                            </Link>
                            <span className="text-sm text-ink-soft">{variant.label}</span>
                          </div>
                          <button
                            type="button"
                            className="icon-btn size-9 shrink-0 text-ink-soft hover:text-tomato"
                            onClick={() => removeFromCart(variant.id)}
                            aria-label={`Remove ${product.name} ${variant.label}`}
                          >
                            <PiTrashBold size={18} />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                          <QuantityStepper
                            value={quantity}
                            max={Math.min(variant.stock, 99)}
                            onChange={(next) => setCartQuantity(variant.id, next)}
                            size="sm"
                            allowZero
                            label={`${product.name} ${variant.label}`}
                          />
                          <span className="font-bold tabular-nums">{money(variant.price * quantity)}</span>
                        </div>
                        {quantity > variant.stock && (
                          <p className="mt-1 text-xs font-bold text-tomato">
                            Only {variant.stock} left — please lower the quantity.
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {suggestions.length > 0 && (
                  <div className="mt-6">
                    <p className="eyebrow mb-2">Goes well with</p>
                    <ul className="grid gap-2">
                      {suggestions.map((product) => {
                        const variant = product.variants.find((v) => v.stock > 0)!;
                        return (
                          <li key={product.id} className="flex items-center gap-3 rounded-xl bg-paper p-2">
                            <span className="relative block size-12 shrink-0 overflow-hidden rounded-lg">
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
                              + Add
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
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Subtotal</span>
                <span className="tabular-nums">{money(subtotal)}</span>
              </div>
              <p className="mb-3 text-sm text-ink-soft">Delivery is calculated at checkout. Pay cash when it arrives.</p>
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <Link href="/bag" className="btn btn-soft">
                  View bag
                </Link>
                <Link href="/checkout" className="btn btn-primary">
                  Checkout · {money(subtotal)}
                </Link>
              </div>
            </div>
          )}
        </div>
      </dialog>

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2 transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        {toast && (
          <span className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cream shadow-pop">
            <PiCheckBold size={14} aria-hidden="true" />
            {toast}
          </span>
        )}
      </div>
    </>
  );
}
