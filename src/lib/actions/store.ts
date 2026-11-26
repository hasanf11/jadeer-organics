"use server";

import { after } from "next/server";
import { z } from "zod";
import { dictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { notifyShopOfMessage } from "@/lib/emails";
import { normalizePhone } from "@/lib/phone";
import { allowAttempt, isBot } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";
import type { FormState } from "@/lib/actions/newsletter";

function messagesFor(formData: FormData) {
  const value = formData.get("locale");
  const locale: Locale = isLocale(value) ? value : "en";
  return dictionary(locale).messages;
}

/** "Tell me when it's back" for a sold-out size. */
export async function requestStockAlert(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = messagesFor(formData);
  if (isBot(formData)) return { ok: true, message: t.alertOk };

  const variantId = z.uuid().safeParse(formData.get("variantId"));
  const name = z.string().trim().max(100).safeParse(formData.get("name") ?? "");
  const phone = normalizePhone(String(formData.get("phone") ?? "").trim());

  if (!variantId.success || !name.success) return { ok: false, message: t.generic };
  if (!phone) return { ok: false, message: t.invalidPhone };
  if (!(await allowAttempt("stock-alert", 8, 3600))) return { ok: false, message: t.tooMany };

  const supabase = createServiceClient();
  const { error } = await supabase.from("stock_alerts").insert({ variant_id: variantId.data, name: name.data, phone });
  if (error && error.code !== "23505") {
    console.error("Stock alert failed:", error.code);
    return { ok: false, message: t.generic };
  }
  return { ok: true, message: t.alertOk };
}

/** Reviews are published once the shop approves them. */
export async function submitReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = messagesFor(formData);
  if (isBot(formData)) return { ok: true, message: t.reviewOk };

  const parsed = z
    .object({
      productId: z.uuid(),
      name: z.string().trim().min(2, t.reviewName).max(60),
      rating: z.coerce.number().int().min(1, t.reviewRating).max(5, t.reviewRating),
      body: z.string().trim().min(5, t.reviewBody).max(1500),
    })
    .safeParse({
      productId: formData.get("productId"),
      name: formData.get("name"),
      rating: formData.get("rating") || 0,
      body: formData.get("body"),
    });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? t.generic };
  if (!(await allowAttempt("review", 4, 3600))) return { ok: false, message: t.tooMany };

  const supabase = createServiceClient();
  const { error } = await supabase.from("reviews").insert({
    product_id: parsed.data.productId,
    author_name: parsed.data.name,
    rating: parsed.data.rating,
    body: parsed.data.body,
  });
  if (error) {
    console.error("Review failed:", error.code);
    return { ok: false, message: t.generic };
  }
  return { ok: true, message: t.reviewOk };
}

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = messagesFor(formData);
  if (isBot(formData)) return { ok: true, message: t.contactOk };

  const parsed = z
    .object({
      name: z.string().trim().min(2, t.contactName).max(100),
      phone: z.string().trim().max(40),
      email: z.string().trim().max(254),
      topic: z.enum(["general", "order", "wholesale", "product", "feedback"]),
      message: z.string().trim().min(5, t.contactMessage).max(3000),
    })
    .safeParse({
      name: formData.get("name"),
      phone: formData.get("phone") ?? "",
      email: formData.get("email") ?? "",
      topic: formData.get("topic") ?? "general",
      message: formData.get("message"),
    });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? t.generic };

  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : "";
  if (phone === null) return { ok: false, message: t.invalidPhone };
  if (parsed.data.email && !z.email().safeParse(parsed.data.email).success) return { ok: false, message: t.invalidEmail };
  if (!phone && !parsed.data.email) return { ok: false, message: t.contactReach };
  if (!(await allowAttempt("contact", 5, 3600))) return { ok: false, message: t.tooMany };

  const message = { ...parsed.data, phone, email: parsed.data.email.toLowerCase() };
  const supabase = createServiceClient();
  const { error } = await supabase.from("contact_messages").insert(message);
  if (error) {
    console.error("Contact message failed:", error.code);
    return { ok: false, message: t.generic };
  }

  after(() => notifyShopOfMessage(message));
  return { ok: true, message: t.contactOk };
}
