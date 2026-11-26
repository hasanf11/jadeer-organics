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
      <div className="flex flex-col gap-2 rounded-[1.5rem] bg-white p-2 sm:flex-row sm:rounded-full">
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
          className="min-h-12 flex-1 rounded-full bg-transparent px-4 text-ink outline-none placeholder:text-ink-soft/70"
        />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
        <button type="submit" className="btn btn-tomato" disabled={pending}>
          {pending ? "Joining…" : "Join the club"}
        </button>
      </div>
      <p role="status" aria-live="polite" className={`mt-2 min-h-6 text-sm font-semibold ${state.ok ? "text-lime" : "text-sun"}`}>
        {state.message}
      </p>
    </form>
  );
}
