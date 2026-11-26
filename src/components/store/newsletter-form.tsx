"use client";

import { useActionState } from "react";
import { PiPaperPlaneTiltBold } from "react-icons/pi";
import { useI18n } from "@/components/i18n-provider";
import { subscribeNewsletter, type FormState } from "@/lib/actions/newsletter";

export default function NewsletterForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeNewsletter, { ok: false, message: "" });
  const dark = tone === "dark";

  return (
    <form action={action} className="w-full">
      <input type="hidden" name="locale" value={locale} />
      <div className={`flex gap-2 rounded-full p-1.5 ${dark ? "bg-white/10 ring-1 ring-white/20" : "bg-white shadow-soft"}`}>
        <label htmlFor={`newsletter-email-${tone}`} className="sr-only">{t.footer.emailPlaceholder}</label>
        <input
          id={`newsletter-email-${tone}`}
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          inputMode="email"
          placeholder={t.footer.emailPlaceholder}
          className={`min-h-11 min-w-0 flex-1 rounded-full bg-transparent px-4 text-[16px] outline-none ${dark ? "text-cream placeholder:text-cream/50" : "text-ink placeholder:text-ink-soft/60"}`}
        />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
        <button type="submit" className="btn btn-sun shrink-0 px-5" disabled={pending}>
          <PiPaperPlaneTiltBold className="rtl:-scale-x-100" aria-hidden="true" />
          <span className="max-sm:sr-only">{pending ? t.footer.subscribing : t.footer.subscribe}</span>
        </button>
      </div>
      <p role="status" aria-live="polite" className={`mt-2 min-h-6 text-sm font-bold ${state.ok ? (dark ? "text-lime" : "text-leaf") : dark ? "text-[#ffb59a]" : "text-tomato"}`}>
        {state.message}
      </p>
    </form>
  );
}
