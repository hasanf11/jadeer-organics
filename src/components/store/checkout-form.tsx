"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  PiArrowLeftBold,
  PiCaretDownBold,
  PiHandCoinsBold,
  PiLockSimpleBold,
  PiTagBold,
  PiXBold,
} from "react-icons/pi";
import ProductVisual from "@/components/product-visual";
import { FreeDeliveryMeter, useBagLines } from "@/components/store/bag-drawer";
import { useStore } from "@/components/store/store-provider";
import { checkPromoCode, placeOrder, saveCheckoutLead } from "@/lib/actions/checkout";
import { removeFromCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";
import { describePromo, orderTotals, type AppliedPromo } from "@/lib/pricing";

const SESSION_KEY = "jadeer:checkout-session:v1";
const DETAILS_KEY = "jadeer:checkout-details:v1";

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function checkoutSession(): { checkoutKey: string; trackingToken: string } {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
    if (saved?.checkoutKey && saved?.trackingToken) return saved;
  } catch {
    /* start a new one */
  }
  const session = { checkoutKey: crypto.randomUUID(), trackingToken: randomToken() };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* private mode */
  }
  return session;
}

type Details = { name: string; phone: string; email: string; zoneId: string; address: string; notes: string };
const EMPTY: Details = { name: "", phone: "", email: "", zoneId: "", address: "", notes: "" };

export default function CheckoutForm() {
  const router = useRouter();
  const { zones, settings } = useStore();
  const { lines, subtotal, ready } = useBagLines();
  const [details, setDetails] = useState<Details>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoPending, startPromo] = useTransition();
  const [placing, setPlacing] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const leadTimer = useRef<number | undefined>(undefined);

  // Remember details for returning customers (on this device only).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DETAILS_KEY) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after hydration
      if (saved) setDetails({ ...EMPTY, ...saved, notes: "" });
    } catch {
      /* nothing saved */
    }
  }, []);

  const zone = zones.find((z) => z.id === details.zoneId) ?? null;
  const totals = orderTotals({
    subtotal,
    zoneFee: zone?.fee_cents ?? null,
    freeThreshold: settings.free_delivery_threshold_cents,
    promo,
  });
  const overStock = lines.filter((l) => l.quantity > l.variant.stock);

  const leadItems = useMemo(
    () => lines.map((l) => ({ name: l.product.name, label: l.variant.label, quantity: l.quantity })),
    [lines],
  );

  function set<K extends keyof Details>(key: K, value: Details[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // Save an unfinished checkout a moment after the phone number is typed,
  // so the shop can help if the visitor doesn't finish.
  useEffect(() => {
    window.clearTimeout(leadTimer.current);
    if (!normalizePhone(details.phone) || leadItems.length === 0) return;
    leadTimer.current = window.setTimeout(() => {
      void saveCheckoutLead({
        name: details.name,
        phone: details.phone,
        zone: zone?.name ?? "",
        subtotal,
        items: leadItems,
      });
    }, 2500);
    return () => window.clearTimeout(leadTimer.current);
  }, [details.phone, details.name, zone?.name, subtotal, leadItems]);

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoError(null);
    startPromo(async () => {
      const result = await checkPromoCode(code, subtotal);
      if (result.ok) {
        setPromo(result.promo);
        setPromoInput("");
      } else {
        setPromoError(result.error);
      }
    });
  }

  function validate(): boolean {
    const next: Partial<Record<keyof Details, string>> = {};
    if (details.name.trim().length < 2) next.name = "Please enter your full name.";
    if (!normalizePhone(details.phone)) next.phone = "Please enter a valid phone number, e.g. 70 123 456.";
    if (details.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(details.email.trim())) next.email = "Please check your email.";
    if (!details.zoneId) next.zoneId = "Please choose your delivery area.";
    if (details.address.trim().length < 5) next.address = "Please enter your address (area, street, building, floor).";
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) document.getElementById(`checkout-${first}`)?.focus();
    return !first;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validate() || placing) return;
    if (overStock.length) {
      setFormError("Some items have less stock than you asked for. Please lower the quantities.");
      return;
    }
    if (settings.min_order_cents > 0 && subtotal < settings.min_order_cents) {
      setFormError(`The minimum order is ${money(settings.min_order_cents)}.`);
      return;
    }

    setPlacing(true);
    const session = checkoutSession();
    try {
      const result = await placeOrder({
        ...session,
        ...details,
        promoCode: totals.promoApplies && promo ? promo.code : "",
        items: lines.map((l) => ({ variantId: l.variant.id, quantity: l.quantity })),
        expectedTotal: totals.total,
      });

      if (!result.ok) {
        setFormError(result.error);
        if (result.field && result.field in EMPTY) setErrors({ [result.field]: result.error });
        if (result.retry) router.refresh();
        setPlacing(false);
        return;
      }

      try {
        localStorage.setItem(DETAILS_KEY, JSON.stringify({ ...details, notes: "" }));
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        /* storage unavailable */
      }
      for (const line of lines) removeFromCart(line.variant.id);
      router.push(`/order/${result.token}?placed=1`);
    } catch {
      setFormError("Connection problem. Please check your internet and try again — you won't be charged twice.");
      setPlacing(false);
    }
  }

  if (ready && lines.length === 0 && !placing) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto grid size-28 place-items-center rounded-full bg-butter text-6xl">🧺</div>
        <h1 className="mt-5 text-3xl">Your bag is empty</h1>
        <p className="mt-2 text-ink-soft">Add a few good things and come back to check out.</p>
        <Link href="/shop" className="btn btn-primary mt-6">Go shopping</Link>
      </div>
    );
  }

  const fieldClass = (key: keyof Details) => `input ${errors[key] ? "!border-tomato" : ""}`;

  const summary = (
    <div className="grid gap-4">
      <ul className="grid gap-3">
        {lines.map(({ product, variant, quantity }) => (
          <li key={variant.id} className="flex items-center gap-3">
            <span className="relative block size-16 shrink-0 overflow-hidden rounded-xl">
              <ProductVisual image={product.image} alt={product.name} art={product.art} sizes="64px" />
              <span className="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-ink px-1 text-xs font-bold text-cream">
                {quantity}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{product.name}</span>
              <span className="text-sm text-ink-soft">{variant.label}</span>
              {quantity > variant.stock && (
                <span className="block text-xs font-bold text-tomato">Only {variant.stock} available</span>
              )}
            </span>
            <span className="font-bold tabular-nums">{money(variant.price * quantity)}</span>
          </li>
        ))}
      </ul>

      <div>
        {promo ? (
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-mint p-3">
            <span className="flex items-center gap-2 font-bold text-leaf-dark">
              <PiTagBold /> {promo.code} · {describePromo(promo)}
              {!totals.promoApplies && (
                <span className="text-xs text-tomato">(needs {money(promo.minOrderCents)} minimum)</span>
              )}
            </span>
            <button type="button" onClick={() => setPromo(null)} className="icon-btn size-8" aria-label="Remove promo code">
              <PiXBold />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <label htmlFor="promo" className="sr-only">Promo code</label>
            <input
              id="promo"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyPromo();
                }
              }}
              placeholder="Promo code"
              className="input min-h-12 uppercase"
              maxLength={30}
              autoComplete="off"
            />
            <button type="button" onClick={applyPromo} className="btn btn-ink" disabled={promoPending || !promoInput.trim()}>
              {promoPending ? "…" : "Apply"}
            </button>
          </div>
        )}
        {promoError && <p className="field-error mt-1.5" role="alert">{promoError}</p>}
      </div>

      <dl className="grid gap-1.5 border-t border-dashed border-line pt-4">
        <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{money(totals.subtotal)}</dd></div>
        <div className="flex justify-between">
          <dt>Delivery {zone ? <span className="text-ink-soft">· {zone.name}</span> : null}</dt>
          <dd className="tabular-nums">
            {!zone ? <span className="text-ink-soft">Choose area</span> : totals.delivery === 0 ? <span className="font-bold text-leaf">Free</span> : money(totals.delivery)}
          </dd>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between font-bold text-leaf"><dt>Discount</dt><dd className="tabular-nums">−{money(totals.discount)}</dd></div>
        )}
        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
          <dt className="text-lg font-bold">Total</dt>
          <dd className="font-display text-3xl font-extrabold tabular-nums">{money(totals.total)}</dd>
        </div>
      </dl>
      <FreeDeliveryMeter subtotal={subtotal} />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-start">
      <div className="grid gap-6">
        <Link href="/bag" className="inline-flex items-center gap-2 text-sm font-bold text-ink-soft hover:text-ink">
          <PiArrowLeftBold /> Back to bag
        </Link>
        <div>
          <h1 className="display-lg">Checkout</h1>
          <p className="mt-2 flex items-center gap-2 text-ink-soft">
            <PiLockSimpleBold className="text-leaf" /> No account needed · pay cash when your order arrives
          </p>
        </div>

        {/* Mobile order summary */}
        <div className="rounded-[1.5rem] bg-white lg:hidden">
          <button
            type="button"
            onClick={() => setSummaryOpen((o) => !o)}
            aria-expanded={summaryOpen}
            className="flex w-full items-center justify-between p-4 font-bold"
          >
            <span className="flex items-center gap-2">
              Order summary ({lines.reduce((s, l) => s + l.quantity, 0)})
              <PiCaretDownBold className={`transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
            </span>
            <span className="font-display text-xl font-extrabold">{money(totals.total)}</span>
          </button>
          {summaryOpen && <div className="border-t border-line p-4">{summary}</div>}
        </div>

        <section className="card grid gap-4 p-5 md:p-7" aria-labelledby="contact-title">
          <h2 id="contact-title" className="flex items-center gap-3 text-2xl">
            <span className="grid size-9 place-items-center rounded-full bg-leaf text-base text-white">1</span> Your details
          </h2>
          <div className="field">
            <label htmlFor="checkout-name">Full name</label>
            <input id="checkout-name" className={fieldClass("name")} value={details.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" maxLength={100} required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "err-name" : undefined} />
            {errors.name && <p id="err-name" className="field-error">{errors.name}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="checkout-phone">Phone (WhatsApp)</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-ink-soft">🇱🇧</span>
                <input id="checkout-phone" className={`${fieldClass("phone")} pl-11`} value={details.phone} onChange={(e) => set("phone", e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="70 123 456" maxLength={40} required aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "err-phone" : "hint-phone"} />
              </div>
              {errors.phone ? <p id="err-phone" className="field-error">{errors.phone}</p> : <p id="hint-phone" className="field-hint">We&apos;ll confirm your order on this number.</p>}
            </div>
            <div className="field">
              <label htmlFor="checkout-email">Email <span className="font-normal text-ink-soft">(optional)</span></label>
              <input id="checkout-email" className={fieldClass("email")} value={details.email} onChange={(e) => set("email", e.target.value)} type="email" inputMode="email" autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>
          </div>
        </section>

        <section className="card grid gap-4 p-5 md:p-7" aria-labelledby="delivery-title">
          <h2 id="delivery-title" className="flex items-center gap-3 text-2xl">
            <span className="grid size-9 place-items-center rounded-full bg-tomato text-base text-white">2</span> Delivery
          </h2>
          <fieldset>
            <legend className="field-label mb-2">Delivery area</legend>
            <div id="checkout-zoneId" tabIndex={-1} className="grid gap-2 sm:grid-cols-2">
              {zones.map((z) => {
                const free = settings.free_delivery_threshold_cents > 0 && subtotal >= settings.free_delivery_threshold_cents;
                return (
                  <label
                    key={z.id}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-2xl border-[3px] p-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sun ${
                      details.zoneId === z.id ? "border-leaf bg-mint" : "border-line bg-white hover:border-ink"
                    }`}
                  >
                    <input type="radio" name="zone" value={z.id} checked={details.zoneId === z.id} onChange={() => set("zoneId", z.id)} className="sr-only" />
                    <span>
                      <span className="block font-bold leading-tight">{z.name}</span>
                      {z.eta && <span className="text-xs text-ink-soft">{z.eta}</span>}
                    </span>
                    <span className="shrink-0 text-sm font-bold">{free || z.fee_cents === 0 ? <span className="text-leaf">Free</span> : money(z.fee_cents)}</span>
                  </label>
                );
              })}
            </div>
            {errors.zoneId && <p className="field-error mt-1.5">{errors.zoneId}</p>}
          </fieldset>
          <div className="field">
            <label htmlFor="checkout-address">Full address</label>
            <textarea id="checkout-address" className={`${fieldClass("address")} min-h-24`} value={details.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" placeholder="Town, street, building, floor, nearby landmark" maxLength={500} required aria-invalid={Boolean(errors.address)} />
            {errors.address && <p className="field-error">{errors.address}</p>}
          </div>
          <div className="field">
            <label htmlFor="checkout-notes">Note for us <span className="font-normal text-ink-soft">(optional)</span></label>
            <input id="checkout-notes" className="input" value={details.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. call before arriving" maxLength={1000} />
          </div>
          {settings.order_notice && <p className="rounded-2xl bg-butter/70 p-3 text-sm font-semibold text-[#6b4a00]">🕓 {settings.order_notice}</p>}
        </section>

        <section className="card flex items-center gap-4 p-5 md:p-7" aria-labelledby="payment-title">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sun text-brown"><PiHandCoinsBold size={30} /></span>
          <div>
            <h2 id="payment-title" className="text-xl">Cash on delivery</h2>
            <p className="text-sm text-ink-soft">Pay the driver in cash (USD or LBP at the day&apos;s rate) when your order arrives.</p>
          </div>
        </section>

        {formError && (
          <p role="alert" className="rounded-2xl bg-tomato/10 p-4 font-bold text-tomato">{formError}</p>
        )}

        <button type="submit" className="btn btn-primary min-h-14 w-full text-lg" disabled={placing || !settings.accepting_orders}>
          {placing ? (
            <>
              <span className="size-5 animate-spin rounded-full border-[3px] border-white/40 border-t-white" /> Placing your order…
            </>
          ) : settings.accepting_orders ? (
            <>Place order · {money(totals.total)}</>
          ) : (
            "Online orders are paused"
          )}
        </button>
        <p className="-mt-3 text-center text-xs text-ink-soft">
          By placing your order you agree to our <Link href="/terms" className="underline">terms</Link> and{" "}
          <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </div>

      <aside className="card sticky top-28 hidden p-6 lg:block" aria-label="Order summary">
        <h2 className="mb-4 text-2xl">Your order</h2>
        {summary}
      </aside>
    </form>
  );
}
