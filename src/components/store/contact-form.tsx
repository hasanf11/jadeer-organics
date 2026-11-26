"use client";

import { useActionState } from "react";
import { PiCheckCircleBold, PiPaperPlaneTiltBold } from "react-icons/pi";
import { useI18n } from "@/components/i18n-provider";
import { sendContactMessage } from "@/lib/actions/store";
import type { FormState } from "@/lib/actions/newsletter";

export default function ContactForm({ defaultTopic = "general", title }: { defaultTopic?: string; title?: string }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(sendContactMessage, { ok: false, message: "" });

  if (state.ok) {
    return (
      <div role="status" className="grid place-items-center rounded-3xl bg-mint p-10 text-center">
        <PiCheckCircleBold size={44} className="text-leaf" aria-hidden="true" />
        <p className="mt-4 font-display text-2xl">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4 rounded-3xl bg-paper p-6 shadow-soft md:p-8">
      {title && <h2 className="text-2xl">{title}</h2>}
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
      <div className="field">
        <label htmlFor="contact-name">{t.contact.name}</label>
        <input id="contact-name" name="name" className="input" required minLength={2} maxLength={100} autoComplete="name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="contact-phone">{t.contact.phone}</label>
          <input id="contact-phone" name="phone" className="input" type="tel" inputMode="tel" dir="ltr" maxLength={40} autoComplete="tel" placeholder="70 123 456" />
        </div>
        <div className="field">
          <label htmlFor="contact-email">{t.contact.email}</label>
          <input id="contact-email" name="email" className="input" type="email" dir="ltr" maxLength={254} autoComplete="email" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="contact-topic">{t.contact.topic}</label>
        <select id="contact-topic" name="topic" className="input" defaultValue={defaultTopic}>
          {(Object.keys(t.contact.topics) as (keyof typeof t.contact.topics)[]).map((key) => (
            <option key={key} value={key}>{t.contact.topics[key]}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="contact-message">{t.contact.message}</label>
        <textarea id="contact-message" name="message" className="input" required minLength={5} maxLength={3000} />
      </div>
      {state.message && <p role="alert" className="field-error">{state.message}</p>}
      <button type="submit" className="btn btn-primary justify-self-start" disabled={pending}>
        <PiPaperPlaneTiltBold className="rtl:-scale-x-100" aria-hidden="true" /> {pending ? t.contact.sending : t.contact.send}
      </button>
    </form>
  );
}
