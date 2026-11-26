"use server";

import { z } from "zod";
import { dictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n/config";
import { allowAttempt, isBot } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";

export type FormState = { ok: boolean; message: string };

const schema = z.object({ email: z.string().trim().toLowerCase().max(254).pipe(z.email()) });

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = dictionary(isLocale(formData.get("locale")) ? (formData.get("locale") as "en" | "ar") : "en").messages;
  if (isBot(formData)) return { ok: true, message: t.newsletterOk };

  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, message: t.invalidEmail };

  if (!(await allowAttempt("newsletter", 5, 3600))) return { ok: false, message: t.tooMany };

  const supabase = createServiceClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({ email: parsed.data.email });
  if (error && error.code !== "23505") {
    console.error("Newsletter sign-up failed:", error.code);
    return { ok: false, message: t.generic };
  }
  return { ok: true, message: t.newsletterOk };
}
