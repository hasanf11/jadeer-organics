"use server";

import { z } from "zod";
import { allowAttempt, isBot } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";

export type FormState = { ok: boolean; message: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
});

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { ok: true, message: "Thank you! You're on the list." };

  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, message: "Please enter a valid email address." };

  if (!(await allowAttempt("newsletter", 5, 3600))) {
    return { ok: false, message: "Too many attempts. Please try again later." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email: parsed.data.email });

  if (error && error.code !== "23505") {
    console.error("Newsletter sign-up failed:", error.code);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  return { ok: true, message: "Thank you! You're on the list." };
}
