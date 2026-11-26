"use client";

import { useActionState } from "react";
import { subscribeNewsletter, type FormState } from "@/lib/actions/newsletter";

export default function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeNewsletter, {
    ok: false,
    message: "",
  });

  return (
    <form action={action} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:rounded-full sm:border sm:border-white/20 sm:p-1">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="Your email address"
          className="min-h-12 flex-1 rounded-full border border-white/20 bg-transparent px-5 text-cream outline-none placeholder:text-cream/40 focus:border-white/60 sm:border-0"
        />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
        <button type="submit" className="btn bg-cream text-ink hover:bg-white" disabled={pending}>
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      <p role="status" aria-live="polite" className={`mt-2 min-h-6 text-sm font-semibold ${state.ok ? "text-lime" : "text-[#f0b59b]"}`}>
        {state.message}
      </p>
    </form>
  );
}
