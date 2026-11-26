"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  PiBellRingingBold,
    PiHandCoinsBold,
  PiHeartBold,
  PiHeartFill,
  PiShareNetworkBold,
  PiShoppingBagOpenBold,
  PiTruckBold,
} from "react-icons/pi";
import QuantityStepper from "@/components/store/quantity-stepper";
import { useStore } from "@/components/store/store-provider";
import { requestStockAlert } from "@/lib/actions/store";
import type { FormState } from "@/lib/actions/newsletter";
import { addToCart, openBag, toggleWishlist, useCart, useWishlist } from "@/lib/cart";
import { flyToBag } from "@/lib/fly-to-bag";
import { money, shortMoney } from "@/lib/format";
import type { Variant } from "@/lib/catalog";

function StockAlertForm({ variant }: { variant: Variant }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestStockAlert, { ok: false, message: "" });

  if (state.ok) {
    return <p className="rounded-2xl bg-mint p-4 font-bold text-leaf-dark" role="status">{state.message}</p>;
  }

  return (
    <form action={action} className="rounded-2xl border border-line bg-paper p-5">
      <p className="flex items-center gap-2 font-semibold">
        <PiBellRingingBold size={19} className="text-leaf" /> {variant.label} is sold out — get a WhatsApp when it&apos;s back
      </p>
      <input type="hidden" name="variantId" value={variant.id} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <label className="sr-only" htmlFor="alert-name">Your name</label>
        <input id="alert-name" name="name" className="input" placeholder="Your name" maxLength={100} autoComplete="name" />
        <label className="sr-only" htmlFor="alert-phone">Phone number</label>
        <input id="alert-phone" name="phone" className="input" placeholder="Phone e.g. 70 123 456" inputMode="tel" autoComplete="tel" required maxLength={40} />
        <button type="submit" className="btn btn-ink" disabled={pending}>
          {pending ? "Saving…" : "Notify me"}
        </button>
      </div>
      {state.message && <p className="field-error mt-2" role="alert">{state.message}</p>}
    </form>
  );
}

export default function ProductPurchase({
  productId,
  name,
  variants,
  freeThreshold,
}: {
  productId: string;
  name: string;
  variants: Variant[];
  freeThreshold: number;
}) {
  const router = useRouter();
  const { ids } = useWishlist();
  const { items } = useCart();
  const { settings } = useStore();
  const saved = ids.includes(productId);
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable.id);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const buttonsRef = useRef<HTMLDivElement>(null);

  const variant = variants.find((v) => v.id === variantId) ?? firstAvailable;
  const inBag = items.find((i) => i.variantId === variant.id)?.quantity ?? 0;
  const maxQty = Math.max(1, Math.min(99, variant.stock - inBag));
  const soldOut = variant.stock < 1;
  const lowStock = !soldOut && variant.stock <= settings.low_stock_threshold;

  useEffect(() => {
    const el = buttonsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function add(goToCheckout = false) {
    try {
      addToCart(variant.id, quantity, variant.stock);
      flyToBag(document.querySelector<HTMLElement>("[data-gallery] img, [data-gallery] svg"));
      setMessage({ ok: true, text: `${quantity} × ${name} (${variant.label}) added to your bag` });
      setQuantity(1);
      if (goToCheckout) router.push("/checkout");
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Could not add to bag." });
    }
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: `${name} — Ja'deer Organics`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage({ ok: true, text: "Link copied to your clipboard." });
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div>
      <div className="flex items-end gap-3">
        <span className="font-display text-4xl">{money(variant.price)}</span>
        {variant.compareAt && variant.compareAt > variant.price && (
          <>
            <span className="pb-1 text-lg text-ink-soft line-through">{money(variant.compareAt)}</span>
            <span className="chip mb-1.5 bg-tomato text-white">
              Save {Math.round((1 - variant.price / variant.compareAt) * 100)}%
            </span>
          </>
        )}
      </div>

      <fieldset className="mt-6">
        <legend className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">
          Size — <span className="text-ink">{variant.label}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const selected = v.id === variant.id;
            return (
              <label
                key={v.id}
                className={`relative min-w-24 cursor-pointer rounded-xl border px-4 py-2.5 text-center transition-all has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-leaf ${
                  selected ? "border-ink bg-paper shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-line bg-paper hover:border-ink"
                } ${v.stock < 1 ? "opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={selected}
                  onChange={() => {
                    setVariantId(v.id);
                    setQuantity(1);
                    setMessage(null);
                  }}
                  className="sr-only"
                />
                <span className="block font-semibold">{v.label}</span>
                <span className="block text-sm text-ink-soft">{v.stock < 1 ? "Sold out" : shortMoney(v.price)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {lowStock && (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-tomato">
          <span className="size-1.5 rounded-full bg-tomato" /> Only {variant.stock} left in stock
        </p>
      )}

      <div ref={buttonsRef} className="mt-6">
        {soldOut ? (
          <StockAlertForm key={variant.id} variant={variant} />
        ) : (
          <div className="grid gap-3">
            <div className="flex gap-3">
              <QuantityStepper value={quantity} max={maxQty} onChange={setQuantity} label={name} />
              <button type="button" onClick={() => add()} className="btn btn-primary min-h-12 flex-1" disabled={inBag >= variant.stock}>
                <PiShoppingBagOpenBold size={19} /> Add to bag
              </button>
            </div>
            <button type="button" onClick={() => add(true)} className="btn btn-ghost min-h-12 w-full" disabled={inBag >= variant.stock}>
              Buy now — pay on delivery
            </button>
            {inBag >= variant.stock && (
              <p className="text-sm font-bold text-ink-soft">You already have all available stock of this size in your bag.</p>
            )}
          </div>
        )}
      </div>

      {message && (
        <div
          role={message.ok ? "status" : "alert"}
          className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-sm font-semibold ${
            message.ok ? "bg-mint text-leaf-dark" : "bg-tomato/10 text-tomato"
          }`}
        >
          {message.text}
          {message.ok && (
            <button type="button" onClick={openBag} className="underline underline-offset-2">
              View bag
            </button>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-6 text-sm font-semibold">
        <button type="button" onClick={() => toggleWishlist(productId)} aria-pressed={saved} className={`flex items-center gap-2 py-2 hover:text-leaf ${saved ? "text-tomato" : "text-ink"}`}>
          {saved ? <PiHeartFill size={18} /> : <PiHeartBold size={18} />} {saved ? "Saved to wishlist" : "Add to wishlist"}
        </button>
        <button type="button" onClick={share} className="flex items-center gap-2 py-2 hover:text-leaf">
          <PiShareNetworkBold size={18} /> Share
        </button>
      </div>

      <ul className="mt-6 grid gap-3 rounded-2xl bg-sand/60 p-5 text-sm">
        <li className="flex items-center gap-3">
          <PiTruckBold size={20} className="shrink-0 text-leaf" />
          <span>
            <strong>Delivery all over Lebanon.</strong>{" "}
            {freeThreshold > 0 ? `Free on orders over ${shortMoney(freeThreshold)}.` : ""}
          </span>
        </li>
        <li className="flex items-center gap-3">
          <PiHandCoinsBold size={20} className="shrink-0 text-leaf" />
          <span>
            <strong>Cash on delivery.</strong> No card, no account needed.
          </span>
        </li>
      </ul>

      {/* Sticky add-to-bag bar on phones */}
      {!soldOut && (
        <div
          className={`fixed inset-x-0 bottom-[4.4rem] z-30 border-t border-line bg-paper/95 px-4 py-2.5 backdrop-blur-xl transition-transform duration-300 lg:hidden ${
            showSticky ? "translate-y-0" : "translate-y-[150%]"
          }`}
          aria-hidden={!showSticky}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{name}</p>
              <p className="text-sm text-ink-soft">
                {variant.label} · <span className="font-bold text-leaf">{money(variant.price)}</span>
              </p>
            </div>
            <button type="button" onClick={() => add()} className="btn btn-primary btn-sm" tabIndex={showSticky ? 0 : -1} disabled={inBag >= variant.stock}>
              <PiShoppingBagOpenBold /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
