"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  PiArrowLeftBold,
  PiArrowRightBold,
  PiCaretDownBold,
  PiCheckCircleFill,
  PiHandCoinsBold,
  PiLockSimpleBold,
  PiShoppingBagOpenBold,
  PiTagBold,
  PiXBold,
} from "react-icons/pi";
import ProductVisual from "@/components/product-visual";
import { FreeDeliveryMeter, useBagLines } from "@/components/store/bag-drawer";
import { useStore } from "@/components/store/store-provider";
import { useI18n } from "@/components/i18n-provider";
import { checkPromoCode, placeOrder, saveCheckoutLead } from "@/lib/actions/checkout";
import { removeFromCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { saveOrder } from "@/lib/my-orders";
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
  const { t, href, locale, rtl } = useI18n();
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
  const Back = rtl ? PiArrowRightBold : PiArrowLeftBold;
  const e = t.checkout.errors;

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
  const totals = orderTotals({ subtotal, zoneFee: zone?.fee_cents ?? null, freeThreshold: settings.free_delivery_threshold_cents, promo });
  const overStock = lines.filter((l) => l.quantity > l.variant.stock);
  const leadItems = useMemo(() => lines.map((l) => ({ name: l.product.nameEn, label: l.variant.label, quantity: l.quantity })), [lines]);

  function set<K extends keyof Details>(key: K, value: Details[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  // Save an unfinished checkout shortly after the phone number is typed,
  // so the shop can help if the visitor doesn't finish.
  useEffect(() => {
    window.clearTimeout(leadTimer.current);
    if (!normalizePhone(details.phone) || leadItems.length === 0) return;
    leadTimer.current = window.setTimeout(() => {
      void saveCheckoutLead({ name: details.name, phone: details.phone, zone: zone?.name ?? "", subtotal, items: leadItems });
    }, 2500);
    return () => window.clearTimeout(leadTimer.current);
  }, [details.phone, details.name, zone?.name, subtotal, leadItems]);

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoError(null);
    startPromo(async () => {
      const result = await checkPromoCode(code, subtotal, locale);
      if (result.ok) {
        setPromo(result.promo);
        setPromoInput("");
      } else setPromoError(result.error);
    });
  }

  function validate(): boolean {
    const next: Partial<Record<keyof Details, string>> = {};
    if (details.name.trim().length < 2) next.name = e.name;
    if (!normalizePhone(details.phone)) next.phone = e.phone;
    if (details.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(details.email.trim())) next.email = e.email;
    if (!details.zoneId) next.zoneId = e.area;
    if (details.address.trim().length < 5) next.address = e.address;
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      const el = document.getElementById(`checkout-${first}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }
    return !first;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validate() || placing) return;
    if (overStock.length) return setFormError(e.stock);
    if (settings.min_order_cents > 0 && subtotal < settings.min_order_cents) return setFormError(e.minimum(money(settings.min_order_cents)));

    setPlacing(true);
    const session = checkoutSession();
    try {
      const result = await placeOrder({
        ...session,
        ...details,
        locale,
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
      saveOrder({ number: result.orderNumber, token: result.token, total: totals.total, date: new Date().toISOString() });
      for (const line of lines) removeFromCart(line.variant.id);
      router.push(`${href(`/order/${result.token}`)}?placed=1`);
    } catch {
      setFormError(e.connection);
      setPlacing(false);
    }
  }

  if (ready && lines.length === 0 && !placing) {
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

  const fieldClass = (key: keyof Details) => `input ${errors[key] ? "!border-tomato" : ""}`;
  const err = (key: keyof Details) => errors[key] && <p id={`err-${key}`} className="field-error">{errors[key]}</p>;

  const summary = (
    <div className="grid gap-4">
      <ul className="grid gap-3">
        {lines.map(({ product, variant, quantity }) => (
          <li key={variant.id} className="flex items-center gap-3">
            <span className="relative block size-16 shrink-0 overflow-hidden rounded-xl bg-sand">
              <ProductVisual image={product.image} alt={product.name} art={product.art} sizes="64px" />
              <span className="absolute end-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-ink px-1 text-xs font-bold text-cream">{quantity}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{product.name}</span>
              <span className="text-sm text-ink-soft">{variant.label}</span>
              {quantity > variant.stock && <span className="block text-xs font-bold text-tomato">{t.bag.onlyAvailable(variant.stock)}</span>}
            </span>
            <span className="font-bold tabular-nums">{money(variant.price * quantity)}</span>
          </li>
        ))}
      </ul>

      <div>
        {promo ? (
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-mint p-3">
            <span className="flex flex-wrap items-center gap-2 font-bold text-leaf-dark">
              <PiTagBold aria-hidden="true" /> <span dir="ltr">{promo.code}</span> · {describePromo(promo)}
              {!totals.promoApplies && <span className="text-xs text-tomato">{t.checkout.needsMinimum(money(promo.minOrderCents))}</span>}
            </span>
            <button type="button" onClick={() => setPromo(null)} className="icon-btn size-9" aria-label={t.checkout.removePromo}>
              <PiXBold />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <label htmlFor="promo" className="sr-only">{t.checkout.promo}</label>
            <input
              id="promo"
              value={promoInput}
              onChange={(ev) => setPromoInput(ev.target.value.toUpperCase())}
              onKeyDown={(ev) => {
                if (ev.key === "Enter") {
                  ev.preventDefault();
                  applyPromo();
                }
              }}
              placeholder={t.checkout.promo}
              className="input min-h-12 uppercase"
              dir="ltr"
              maxLength={30}
              autoComplete="off"
            />
            <button type="button" onClick={applyPromo} className="btn btn-ink" disabled={promoPending || !promoInput.trim()}>
              {promoPending ? "…" : t.checkout.apply}
            </button>
          </div>
        )}
        {promoError && <p className="field-error mt-1.5" role="alert">{promoError}</p>}
      </div>

      <dl className="grid gap-1.5 border-t border-dashed border-line pt-4">
        <div className="flex justify-between"><dt>{t.common.subtotal}</dt><dd className="tabular-nums">{money(totals.subtotal)}</dd></div>
        <div className="flex justify-between gap-3">
          <dt>{t.common.delivery} {zone ? <span className="text-ink-soft">· {zone.name}</span> : null}</dt>
          <dd className="shrink-0 tabular-nums">
            {!zone ? <span className="text-ink-soft">{t.checkout.chooseArea}</span> : totals.delivery === 0 ? <span className="font-bold text-leaf">{t.common.free}</span> : money(totals.delivery)}
          </dd>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between font-bold text-leaf"><dt>{t.common.discount}</dt><dd className="tabular-nums">−{money(totals.discount)}</dd></div>
        )}
        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
          <dt className="text-lg font-bold">{t.common.total}</dt>
          <dd className="font-display text-3xl tabular-nums">{money(totals.total)}</dd>
        </div>
      </dl>
      <FreeDeliveryMeter subtotal={subtotal} />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-start">
      <div className="grid min-w-0 gap-6">
        <Link href={href("/bag")} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink-soft hover:text-ink">
          <Back aria-hidden="true" /> {t.checkout.backToBag}
        </Link>
        <div>
          <h1 className="display-lg">{t.checkout.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-ink-soft">
            <PiLockSimpleBold className="shrink-0 text-leaf" aria-hidden="true" /> {t.checkout.noAccount}
          </p>
        </div>

        <div className="rounded-3xl bg-paper shadow-soft lg:hidden">
          <button type="button" onClick={() => setSummaryOpen((o) => !o)} aria-expanded={summaryOpen} className="flex min-h-14 w-full items-center justify-between p-4 font-bold">
            <span className="flex items-center gap-2">
              {t.checkout.summary} ({lines.reduce((s, l) => s + l.quantity, 0)})
              <PiCaretDownBold className={`transition-transform ${summaryOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </span>
            <span className="font-display text-xl">{money(totals.total)}</span>
          </button>
          {summaryOpen && <div className="border-t border-line p-4">{summary}</div>}
        </div>

        <section className="grid gap-4 rounded-3xl bg-paper p-5 shadow-soft md:p-7" aria-labelledby="contact-title">
          <h2 id="contact-title" className="flex items-center gap-3 text-2xl">
            <span className="grid size-8 place-items-center rounded-full bg-leaf font-sans text-sm font-bold text-white">1</span> {t.checkout.details}
          </h2>
          <div className="field">
            <label htmlFor="checkout-name">{t.checkout.fullName}</label>
            <input id="checkout-name" className={fieldClass("name")} value={details.name} onChange={(ev) => set("name", ev.target.value)} autoComplete="name" maxLength={100} required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "err-name" : undefined} />
            {err("name")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="checkout-phone">{t.checkout.phone}</label>
              <div className="relative" dir="ltr">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-soft">+961</span>
                <input id="checkout-phone" className={`${fieldClass("phone")} pl-14`} value={details.phone} onChange={(ev) => set("phone", ev.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="70 123 456" maxLength={40} required aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "err-phone" : "hint-phone"} />
              </div>
              {errors.phone ? err("phone") : <p id="hint-phone" className="field-hint">{t.checkout.phoneHint}</p>}
            </div>
            <div className="field">
              <label htmlFor="checkout-email">{t.checkout.email} <span className="font-normal text-ink-soft">({t.checkout.optional})</span></label>
              <input id="checkout-email" className={fieldClass("email")} value={details.email} onChange={(ev) => set("email", ev.target.value)} type="email" inputMode="email" dir="ltr" autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby="hint-email" />
              {errors.email ? err("email") : <p id="hint-email" className="field-hint">{t.checkout.emailHint}</p>}
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl bg-paper p-5 shadow-soft md:p-7" aria-labelledby="delivery-title">
          <h2 id="delivery-title" className="flex items-center gap-3 text-2xl">
            <span className="grid size-8 place-items-center rounded-full bg-tomato font-sans text-sm font-bold text-white">2</span> {t.checkout.deliveryTitle}
          </h2>
          <fieldset>
            <legend className="field-label mb-2">{t.checkout.area}</legend>
            <div id="checkout-zoneId" tabIndex={-1} className="grid gap-2 sm:grid-cols-2">
              {zones.map((z) => {
                const free = settings.free_delivery_threshold_cents > 0 && subtotal >= settings.free_delivery_threshold_cents;
                const on = details.zoneId === z.id;
                return (
                  <label
                    key={z.id}
                    className={`flex min-h-14 cursor-pointer items-center justify-between gap-2 rounded-2xl p-3.5 transition-all has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-tomato ${
                      on ? "bg-leaf text-white" : "bg-white shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:shadow-[inset_0_0_0_1.5px_var(--color-leaf)]"
                    }`}
                  >
                    <input type="radio" name="zone" value={z.id} checked={on} onChange={() => set("zoneId", z.id)} className="sr-only" />
                    <span className="flex items-center gap-2">
                      {on && <PiCheckCircleFill className="shrink-0 text-sun" aria-hidden="true" />}
                      <span>
                        <span className="block font-bold leading-tight">{z.name}</span>
                        {z.eta && <span className={`text-xs ${on ? "text-white/75" : "text-ink-soft"}`}>{z.eta}</span>}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold">{free || z.fee_cents === 0 ? t.common.free : money(z.fee_cents)}</span>
                  </label>
                );
              })}
            </div>
            {err("zoneId")}
          </fieldset>
          <div className="field">
            <label htmlFor="checkout-address">{t.checkout.address}</label>
            <textarea id="checkout-address" className={`${fieldClass("address")} min-h-24`} value={details.address} onChange={(ev) => set("address", ev.target.value)} autoComplete="street-address" placeholder={t.checkout.addressPlaceholder} maxLength={500} required aria-invalid={Boolean(errors.address)} />
            {err("address")}
          </div>
          <div className="field">
            <label htmlFor="checkout-notes">{t.checkout.notes} <span className="font-normal text-ink-soft">({t.checkout.optional})</span></label>
            <input id="checkout-notes" className="input" value={details.notes} onChange={(ev) => set("notes", ev.target.value)} placeholder={t.checkout.notesPlaceholder} maxLength={1000} />
          </div>
          {settings.order_notice && <p className="rounded-2xl bg-butter p-3 text-sm font-semibold text-[#6b4a00]">{settings.order_notice}</p>}
        </section>

        <section className="flex items-center gap-4 rounded-3xl bg-paper p-5 shadow-soft md:p-7" aria-labelledby="payment-title">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sun text-forest"><PiHandCoinsBold size={24} aria-hidden="true" /></span>
          <div>
            <h2 id="payment-title" className="text-xl">{t.checkout.paymentTitle}</h2>
            <p className="text-sm text-ink-soft">{t.checkout.paymentText}</p>
          </div>
        </section>

        {formError && <p role="alert" className="rounded-2xl bg-tomato/10 p-4 font-bold text-tomato">{formError}</p>}

        <button type="submit" className="btn btn-primary min-h-14 w-full text-base" disabled={placing || !settings.accepting_orders}>
          {placing ? (
            <>
              <span className="size-5 animate-spin rounded-full border-[3px] border-white/40 border-t-white" /> {t.checkout.placing}
            </>
          ) : settings.accepting_orders ? (
            t.checkout.place(money(totals.total))
          ) : (
            t.checkout.paused
          )}
        </button>
        <p className="-mt-3 text-center text-xs text-ink-soft">
          {t.checkout.agree} <Link href={href("/terms")} className="underline">{t.checkout.terms}</Link> {t.checkout.and}{" "}
          <Link href={href("/privacy")} className="underline">{t.checkout.privacy}</Link>.
        </p>
      </div>

      <aside className="card sticky top-28 hidden p-6 lg:block" aria-label={t.checkout.yourOrder}>
        <h2 className="mb-4 text-2xl">{t.checkout.yourOrder}</h2>
        {summary}
      </aside>
    </form>
  );
}
