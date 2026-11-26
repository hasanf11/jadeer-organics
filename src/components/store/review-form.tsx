"use client";

import { useActionState, useState } from "react";
import { PiStarFill } from "react-icons/pi";
import { useI18n } from "@/components/i18n-provider";
import { submitReview } from "@/lib/actions/store";
import type { FormState } from "@/lib/actions/newsletter";

export default function ReviewForm({ productId }: { productId: string }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(submitReview, { ok: false, message: "" });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state.ok) {
    return <p role="status" className="rounded-2xl bg-mint p-6 text-center font-bold text-leaf-dark">{state.message}</p>;
  }

  return (
    <form action={action} className="grid gap-4 rounded-3xl bg-paper p-5 shadow-soft md:p-6">
      <h3 className="text-xl">{t.product.writeReview}</h3>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
      <fieldset>
        <legend className="field-label mb-1">{t.product.yourRating}</legend>
        <div className="flex gap-1" onPointerLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onPointerEnter={() => setHover(value)}
              aria-label={t.product.stars(value)}
              aria-pressed={rating === value}
              className="grid size-11 place-items-center transition-transform hover:scale-110"
            >
              <PiStarFill size={30} className={(hover || rating) >= value ? "text-sun" : "text-line"} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="review-name">{t.product.yourName}</label>
        <input id="review-name" name="name" className="input" required minLength={2} maxLength={60} autoComplete="given-name" />
      </div>
      <div className="field">
        <label htmlFor="review-body">{t.product.yourReview}</label>
        <textarea id="review-body" name="body" className="input" required minLength={5} maxLength={1500} placeholder={t.product.reviewPlaceholder} />
      </div>
      {state.message && <p className="field-error" role="alert">{state.message}</p>}
      <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
        {pending ? t.product.sending : t.product.submitReview}
      </button>
    </form>
  );
}
