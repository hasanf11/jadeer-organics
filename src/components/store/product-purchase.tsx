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
  PiLightningBold,
} from "react-icons/pi";
import QuantityStepper from "@/components/store/quantity-stepper";
import { useStore } from "@/components/store/store-provider";
import { useI18n } from "@/components/i18n-provider";
import { requestStockAlert } from "@/lib/actions/store";
import type { FormState } from "@/lib/actions/newsletter";
import { addToCart, cartErrorMessage, openBag, toggleWishlist, useCart, useWishlist } from "@/lib/cart";
import { flyToBag } from "@/lib/fly-to-bag";
import { money, shortMoney } from "@/lib/format";
import type { Variant } from "@/lib/catalog";

function StockAlertForm({ variant }: { variant: Variant }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(requestStockAlert, { ok: false, message: "" });

  if (state.ok) return <p className="rounded-2xl bg-mint p-4 font-bold text-leaf-dark" role="status">{state.message}</p>;

  return (
    <form action={action} className="rounded-2xl bg-blush p-5">
      <p className="flex items-center gap-2 font-bold text-berry">
        <PiBellRingingBold size={19} aria-hidden="true" /> {t.product.notifyTitle(variant.label)}
      </p>
      <input type="hidden" name="variantId" value={variant.id} />
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <label className="sr-only" htmlFor="alert-name">{t.product.notifyName}</label>
        <input id="alert-name" name="name" className="input" placeholder={t.product.notifyName} maxLength={100} autoComplete="name" />
        <label className="sr-only" htmlFor="alert-phone">{t.product.notifyPhone}</label>
        <input id="alert-phone" name="phone" className="input" dir="ltr" placeholder={t.product.notifyPhone} inputMode="tel" autoComplete="tel" required maxLength={40} />
        <button type="submit" className="btn btn-ink" disabled={pending}>{pending ? t.product.saving : t.product.notifyMe}</button>
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
  const { t, href } = useI18n();
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
  const allInBag = inBag >= variant.stock;

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
      setMessage({ ok: true, text: t.product.addedMessage(quantity, name, variant.label) });
      setQuantity(1);
      if (goToCheckout) router.push(href("/checkout"));
    } catch (e) {
      setMessage({ ok: false, text: cartErrorMessage(e, t.cartErrors) });
    }
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: name, text: `${name} — ${t.meta.siteName}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage({ ok: true, text: t.product.linkCopied });
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <span className="font-display text-4xl text-leaf-dark">{money(variant.price)}</span>
        {variant.compareAt && variant.compareAt > variant.price && (
          <>
            <span className="pb-1 text-lg text-ink-soft line-through">{money(variant.compareAt)}</span>
            <span className="chip mb-1.5 bg-tomato text-white">{t.product.save(Math.round((1 - variant.price / variant.compareAt) * 100))}</span>
          </>
        )}
      </div>

      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-extrabold text-ink-soft">
          {t.product.size}: <span className="text-ink">{variant.label}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const selected = v.id === variant.id;
            return (
              <label
                key={v.id}
                className={`relative min-w-24 cursor-pointer rounded-2xl px-4 py-2.5 text-center transition-all has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-tomato ${
                  selected ? "bg-leaf text-white shadow-soft" : "bg-paper shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:shadow-[inset_0_0_0_1.5px_var(--color-leaf)]"
                } ${v.stock < 1 ? "opacity-55" : ""}`}
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
                <span className="block font-bold">{v.label}</span>
                <span className={`block text-sm ${selected ? "text-white/80" : "text-ink-soft"}`}>{v.stock < 1 ? t.common.soldOut : shortMoney(v.price)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {lowStock && (
        <p className="mt-4 flex items-center gap-2 text-sm font-bold text-tomato">
          <span className="size-2 animate-pulse rounded-full bg-tomato" /> {t.product.lowStock(variant.stock)}
        </p>
      )}

      <div ref={buttonsRef} className="mt-6">
        {soldOut ? (
          <StockAlertForm key={variant.id} variant={variant} />
        ) : (
          <div className="grid gap-3">
            <div className="flex gap-3">
              <QuantityStepper value={quantity} max={maxQty} onChange={setQuantity} label={name} />
              <button type="button" onClick={() => add()} className="btn btn-primary min-h-12 flex-1" disabled={allInBag}>
                <PiShoppingBagOpenBold size={19} aria-hidden="true" /> {t.common.addToBag}
              </button>
            </div>
            <button type="button" onClick={() => add(true)} className="btn btn-accent min-h-12 w-full" disabled={allInBag}>
              <PiLightningBold aria-hidden="true" /> {t.product.buyNow}
            </button>
            {allInBag && <p className="text-sm font-bold text-ink-soft">{t.product.allInBag}</p>}
          </div>
        )}
      </div>

      {message && (
        <div role={message.ok ? "status" : "alert"} className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3 text-sm font-bold ${message.ok ? "bg-mint text-leaf-dark" : "bg-tomato/10 text-tomato"}`}>
          {message.text}
          {message.ok && (
            <button type="button" onClick={openBag} className="underline underline-offset-2">{t.product.viewBag}</button>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-x-6 text-sm font-bold">
        <button type="button" onClick={() => toggleWishlist(productId)} aria-pressed={saved} className={`flex min-h-11 items-center gap-2 hover:text-tomato ${saved ? "text-berry" : "text-ink"}`}>
          {saved ? <PiHeartFill size={18} /> : <PiHeartBold size={18} />} {saved ? t.product.savedWishlist : t.product.addWishlist}
        </button>
        <button type="button" onClick={share} className="flex min-h-11 items-center gap-2 hover:text-tomato">
          <PiShareNetworkBold size={18} /> {t.product.share}
        </button>
      </div>

      <ul className="mt-5 grid gap-3 rounded-2xl bg-mint/70 p-5 text-sm">
        <li className="flex items-center gap-3">
          <PiTruckBold size={21} className="shrink-0 text-leaf" aria-hidden="true" />
          <span>
            <strong>{t.product.deliveryNote}</strong> {freeThreshold > 0 ? t.product.freeOver(shortMoney(freeThreshold)) : ""}
          </span>
        </li>
        <li className="flex items-center gap-3">
          <PiHandCoinsBold size={21} className="shrink-0 text-tomato" aria-hidden="true" />
          <span>
            <strong>{t.product.codNote}</strong> {t.product.codText}
          </span>
        </li>
      </ul>

      {/* Sticky add-to-bag bar on phones, above the tab bar */}
      {!soldOut && (
        <div
          className={`fixed inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-paper px-4 py-2.5 transition-transform duration-300 lg:hidden ${showSticky ? "translate-y-0" : "translate-y-[160%]"}`}
          aria-hidden={!showSticky}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{name}</p>
              <p className="text-sm text-ink-soft">{variant.label} · <span className="font-bold text-leaf">{money(variant.price)}</span></p>
            </div>
            <button type="button" onClick={() => add()} className="btn btn-primary btn-sm" tabIndex={showSticky ? 0 : -1} disabled={allInBag}>
              <PiShoppingBagOpenBold aria-hidden="true" /> {t.common.addToBag}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
