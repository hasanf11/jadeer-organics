"use client";

import { useActionState } from "react";
import { sendContactMessage } from "@/lib/actions/store";
import type { FormState } from "@/lib/actions/newsletter";

export default function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContactMessage, { ok: false, message: "" });

  if (state.ok) {
    return (
      <div role="status" className="card grid place-items-center p-10 text-center">
        <p className="text-6xl">💌</p>
        <p className="mt-4 text-xl font-bold">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="card grid gap-4 p-6 md:p-8">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
      <div className="field">
        <label htmlFor="contact-name">Your name</label>
        <input id="contact-name" name="name" className="input" required minLength={2} maxLength={100} autoComplete="name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="contact-phone">Phone / WhatsApp</label>
          <input id="contact-phone" name="phone" className="input" type="tel" inputMode="tel" maxLength={40} autoComplete="tel" placeholder="70 123 456" />
        </div>
        <div className="field">
          <label htmlFor="contact-email">Email</label>
          <input id="contact-email" name="email" className="input" type="email" maxLength={254} autoComplete="email" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="contact-topic">What is it about?</label>
        <select id="contact-topic" name="topic" className="input" defaultValue="general">
          <option value="general">A general question</option>
          <option value="order">My order</option>
          <option value="product">A product</option>
          <option value="wholesale">Wholesale / stocking our products</option>
          <option value="feedback">Feedback</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="contact-message">Message</label>
        <textarea id="contact-message" name="message" className="input" required minLength={5} maxLength={3000} />
      </div>
      {state.message && <p role="alert" className="field-error">{state.message}</p>}
      <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
