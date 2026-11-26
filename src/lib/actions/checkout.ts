"use server";

import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { dictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { notifyShopOfOrder, sendOrderEmail } from "@/lib/emails";
import { normalizePhone } from "@/lib/phone";
import { allowAttempt } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";
import type { AppliedPromo } from "@/lib/pricing";

const TOKEN = /^[A-Za-z0-9_-]{43}$/;

const asLocale = (value: unknown): Locale => (isLocale(value) ? value : "en");
const usd = (cents: number) => "$" + (cents / 100).toFixed(2);

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

// ---------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------

export type PromoResult = { ok: true; promo: AppliedPromo } | { ok: false; error: string };

export async function checkPromoCode(rawCode: unknown, subtotal: unknown, rawLocale?: unknown): Promise<PromoResult> {
  const m = dictionary(asLocale(rawLocale)).messages;
  const code = z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/).safeParse(rawCode);
  const amount = z.number().int().min(0).max(100_000_000).safeParse(subtotal);
  if (!code.success || !amount.success) return { ok: false, error: m.promoInvalid };

  if (!(await allowAttempt("promo", 15, 600))) return { ok: false, error: m.promoWait };

  const supabase = createServiceClient();
  const { data: promo } = await supabase
    .from("promotions")
    .select("code, kind, value, min_order_cents, max_uses, uses_count, starts_at, ends_at, is_active, description")
    .eq("code", code.data)
    .maybeSingle();

  const now = Date.now();
  if (
    !promo ||
    !promo.is_active ||
    (promo.starts_at && new Date(promo.starts_at).getTime() > now) ||
    (promo.ends_at && new Date(promo.ends_at).getTime() <= now) ||
    (promo.max_uses != null && promo.uses_count >= promo.max_uses)
  ) {
    return { ok: false, error: m.promoInvalid };
  }
  if (amount.data < promo.min_order_cents) return { ok: false, error: m.promoMinimum(usd(promo.min_order_cents)) };

  return {
    ok: true,
    promo: { code: promo.code, kind: promo.kind, value: promo.value, minOrderCents: promo.min_order_cents, description: promo.description },
  };
}

// ---------------------------------------------------------------------
// Placing an order
// ---------------------------------------------------------------------

const orderSchema = z.object({
  checkoutKey: z.uuid(),
  trackingToken: z.string().regex(TOKEN),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(40),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((v) => v === "" || z.email().safeParse(v).success),
  zoneId: z.uuid(),
  address: z.string().trim().min(5).max(500),
  notes: z.string().trim().max(1000),
  promoCode: z.string().trim().toUpperCase().max(30),
  items: z.array(z.object({ variantId: z.uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
  expectedTotal: z.number().int().min(0),
  locale: z.enum(["en", "ar"]).default("en"),
});

export type PlaceOrderResult =
  | { ok: true; orderNumber: number; token: string }
  | { ok: false; error: string; field?: string; retry?: boolean };

const FIELD_ERRORS: Record<string, string> = {
  name: "INVALID_CUSTOMER_NAME",
  phone: "INVALID_CUSTOMER_PHONE",
  email: "INVALID_CUSTOMER_EMAIL",
  zoneId: "DELIVERY_ZONE_UNAVAILABLE",
  address: "INVALID_DELIVERY_ADDRESS",
  notes: "INVALID_CUSTOMER_NOTES",
  items: "INVALID_CART",
};

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const m = dictionary(asLocale((input as { locale?: unknown } | null)?.locale)).messages;
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0]?.toString() ?? "";
    return { ok: false, error: m.checkout[FIELD_ERRORS[field] ?? "INVALID_CHECKOUT_REQUEST"], field };
  }
  const order = parsed.data;

  const phone = normalizePhone(order.phone);
  if (!phone) return { ok: false, error: m.invalidPhone, field: "phone" };

  if (!(await allowAttempt("checkout", 12, 3600))) return { ok: false, error: m.checkout.TOO_MANY };

  // The same checkout retried returns the same order; a changed bag or
  // address is a new request and is rejected for that key.
  const payload = {
    name: order.name,
    phone,
    email: order.email,
    zoneId: order.zoneId,
    address: order.address,
    notes: order.notes,
    promoCode: order.promoCode,
    items: [...order.items].sort((a, b) => a.variantId.localeCompare(b.variantId)),
    expectedTotal: order.expectedTotal,
  };

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("create_guest_order", {
    p_checkout_key: order.checkoutKey,
    p_request_hash: sha256(JSON.stringify(payload)),
    p_tracking_token: order.trackingToken,
    p_customer_name: order.name,
    p_customer_phone: phone,
    p_customer_email: order.email || null,
    p_zone_id: order.zoneId,
    p_address: order.address,
    p_notes: order.notes,
    p_items: payload.items,
    p_promo_code: order.promoCode || null,
    p_expected_total_cents: order.expectedTotal,
    p_locale: order.locale,
  });

  if (error) {
    const message = error.code === "P0001" ? m.checkout[error.message] : undefined;
    if (message) return { ok: false, error: message, retry: error.message === "TOTAL_CHANGED" };
    console.error("Checkout failed:", error.code, error.message);
    return { ok: false, error: m.checkout.FAILED };
  }

  // Emails to the customer (if they gave one) and to the shop.
  if (!data.repeated) {
    after(() => sendOrderEmail(data.orderId, "placed"));
    after(() => notifyShopOfOrder(data.orderId));
  }

  // Stock changed: refresh the storefront in the background.
  revalidateTag("catalog", "max");

  // The visitor finished checking out — not an abandoned checkout any more.
  await supabase.from("checkout_leads").delete().eq("phone", phone);

  return { ok: true, orderNumber: data.orderNumber, token: order.trackingToken };
}

// ---------------------------------------------------------------------
// Unfinished checkouts (so the shop can follow up personally)
// ---------------------------------------------------------------------

const leadSchema = z.object({
  name: z.string().trim().max(100),
  phone: z.string().trim().max(40),
  zone: z.string().trim().max(80),
  subtotal: z.number().int().min(0).max(100_000_000),
  items: z.array(z.object({ name: z.string().max(140), label: z.string().max(40), quantity: z.number().int().min(1).max(99) })).max(50),
});

export async function saveCheckoutLead(input: unknown): Promise<void> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return;
  const phone = normalizePhone(parsed.data.phone);
  if (!phone || parsed.data.items.length === 0) return;
  if (!(await allowAttempt("lead", 20, 3600))) return;

  const supabase = createServiceClient();
  await supabase.from("checkout_leads").upsert(
    {
      phone,
      name: parsed.data.name,
      zone_name: parsed.data.zone,
      items: parsed.data.items,
      subtotal_cents: parsed.data.subtotal,
      contacted_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "phone" },
  );
}

// ---------------------------------------------------------------------
// Order tracking by number + phone (no account needed)
// ---------------------------------------------------------------------

export type TrackResult =
  | {
      ok: true;
      order: {
        number: number;
        status: string;
        createdAt: string;
        total: number;
        zone: string;
        items: { name: string; slug: string; label: string; quantity: number }[];
      };
    }
  | { ok: false; error: string };

export async function trackOrder(_prev: TrackResult | null, formData: FormData): Promise<TrackResult> {
  const m = dictionary(asLocale(formData.get("locale"))).messages;
  const number = z.coerce.number().int().min(1).max(100_000_000).safeParse(formData.get("number"));
  const phone = normalizePhone(String(formData.get("phone") ?? "").trim());
  if (!number.success || !phone) return { ok: false, error: m.trackMissing };

  if (!(await allowAttempt("track", 10, 3600))) return { ok: false, error: m.tooMany };

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("orders")
    .select("order_number, status, created_at, total_cents, delivery_zone_name, order_items(product_name, product_slug, variant_label, quantity)")
    .eq("order_number", number.data)
    .eq("customer_phone", phone)
    .maybeSingle();

  if (!data) return { ok: false, error: m.trackNotFound };

  return {
    ok: true,
    order: {
      number: data.order_number,
      status: data.status,
      createdAt: data.created_at,
      total: data.total_cents,
      zone: data.delivery_zone_name,
      items: (data.order_items ?? []).map((i) => ({ name: i.product_name, slug: i.product_slug, label: i.variant_label, quantity: i.quantity })),
    },
  };
}
