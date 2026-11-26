"use server";

import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { allowAttempt, isBot } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";
import type { FormState } from "@/lib/actions/newsletter";

const uuid = z.uuid();

/** "Tell me when it's back" for a sold-out size. */
export async function requestStockAlert(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { ok: true, message: "We'll message you as soon as it's back." };

  const variantId = uuid.safeParse(formData.get("variantId"));
  const name = z.string().trim().max(100).safeParse(formData.get("name") ?? "");
  const phone = normalizePhone(String(formData.get("phone") ?? "").trim());

  if (!variantId.success || !name.success) return { ok: false, message: "Please try again." };
  if (!phone) return { ok: false, message: "Please enter a valid phone number (e.g. 70 123 456)." };

  if (!(await allowAttempt("stock-alert", 8, 3600))) {
    return { ok: false, message: "Too many requests. Please try again later." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("stock_alerts")
    .insert({ variant_id: variantId.data, name: name.data, phone });

  if (error && error.code !== "23505") {
    console.error("Stock alert failed:", error.code);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  return { ok: true, message: "Done — we'll send you a WhatsApp message as soon as it's back." };
}

const reviewSchema = z.object({
  productId: z.uuid(),
  name: z.string().trim().min(2, "Please enter your name.").max(60),
  rating: z.coerce.number().int().min(1, "Please choose a rating.").max(5),
  body: z.string().trim().min(5, "Please write a few words.").max(1500),
});

/** Reviews are published once the shop approves them. */
export async function submitReview(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { ok: true, message: "Thank you for your review!" };

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    rating: formData.get("rating"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your review." };
  }

  if (!(await allowAttempt("review", 4, 3600))) {
    return { ok: false, message: "Too many reviews. Please try again later." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("reviews").insert({
    product_id: parsed.data.productId,
    author_name: parsed.data.name,
    rating: parsed.data.rating,
    body: parsed.data.body,
  });

  if (error) {
    console.error("Review failed:", error.code);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  return { ok: true, message: "Thank you! Your review will appear once it's approved." };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  phone: z.string().trim().max(40),
  email: z.string().trim().max(254),
  topic: z.enum(["general", "order", "wholesale", "product", "feedback"]),
  message: z.string().trim().min(5, "Please write a little more.").max(3000),
});

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { ok: true, message: "Thank you! We'll get back to you soon." };

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    topic: formData.get("topic") ?? "general",
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : "";
  if (phone === null) return { ok: false, message: "Please enter a valid phone number." };
  if (parsed.data.email && !z.email().safeParse(parsed.data.email).success) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  if (!phone && !parsed.data.email) {
    return { ok: false, message: "Please leave a phone number or an email so we can reply." };
  }

  if (!(await allowAttempt("contact", 5, 3600))) {
    return { ok: false, message: "Too many messages. Please try again later." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    phone,
    email: parsed.data.email.toLowerCase(),
    topic: parsed.data.topic,
    message: parsed.data.message,
  });

  if (error) {
    console.error("Contact message failed:", error.code);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  return { ok: true, message: "Thank you — your message has been sent. We'll reply very soon." };
}
