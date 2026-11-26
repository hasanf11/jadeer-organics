"use server";

import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { allowAttempt } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";
import type { AppliedPromo } from "@/lib/pricing";

const TOKEN = /^[A-Za-z0-9_-]{43}$/;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

// ---------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------

export type PromoResult = { ok: true; promo: AppliedPromo } | { ok: false; error: string };

export async function checkPromoCode(rawCode: unknown, subtotal: unknown): Promise<PromoResult> {
  const code = z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,30}$/)
    .safeParse(rawCode);
  const amount = z.number().int().min(0).max(100_000_000).safeParse(subtotal);

  if (!code.success || !amount.success) return { ok: false, error: "This code isn't valid." };

  if (!(await allowAttempt("promo", 15, 600))) {
    return { ok: false, error: "Too many attempts. Please wait a few minutes." };
  }

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
    return { ok: false, error: "This code isn't valid or has expired." };
  }

  if (amount.data < promo.min_order_cents) {
    return {
      ok: false,
      error: `This code needs a minimum order of $${(promo.min_order_cents / 100).toFixed(2)}.`,
    };
  }

  return {
    ok: true,
    promo: {
      code: promo.code,
      kind: promo.kind,
      value: promo.value,
      minOrderCents: promo.min_order_cents,
      description: promo.description,
    },
  };
}

// ---------------------------------------------------------------------
// Placing an order
// ---------------------------------------------------------------------

const orderSchema = z.object({
  checkoutKey: z.uuid(),
  trackingToken: z.string().regex(TOKEN),
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  phone: z.string().trim().min(6, "Please enter your phone number.").max(40),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Please check your email address."),
  zoneId: z.uuid("Please choose your delivery area."),
  address: z.string().trim().min(5, "Please enter your full address.").max(500),
  notes: z.string().trim().max(1000),
  promoCode: z.string().trim().toUpperCase().max(30),
  items: z
    .array(z.object({ variantId: z.uuid(), quantity: z.number().int().min(1).max(99) }))
    .min(1, "Your bag is empty.")
    .max(50),
  expectedTotal: z.number().int().min(0),
});

export type PlaceOrderResult =
  | { ok: true; orderNumber: number; token: string }
  | { ok: false; error: string; field?: string; retry?: boolean };

const REJECTED: Record<string, string> = {
  INVALID_CHECKOUT_REQUEST: "Please review your details and try again.",
  STORE_CLOSED: "We're not taking online orders right now. Please message us on WhatsApp.",
  INVALID_CUSTOMER_NAME: "Please check your name.",
  INVALID_CUSTOMER_PHONE: "Please check your phone number.",
  INVALID_CUSTOMER_EMAIL: "Please check your email address.",
  INVALID_DELIVERY_ADDRESS: "Please check your delivery address.",
  INVALID_CUSTOMER_NOTES: "Your note is too long.",
  INVALID_CART: "Please check the items in your bag.",
  DELIVERY_ZONE_UNAVAILABLE: "This delivery area is no longer available. Please choose another one.",
  PRODUCT_UNAVAILABLE: "An item in your bag is no longer available. Please update your bag.",
  INSUFFICIENT_STOCK: "Some stock just changed. Please check the quantities in your bag.",
  BELOW_MINIMUM: "Your order is below the minimum order amount.",
  TOTAL_CHANGED: "A price or delivery fee just changed. Please review your total and place the order again.",
  PROMO_UNAVAILABLE: "Your promo code is no longer valid. Remove it and try again.",
  PROMO_MINIMUM: "Your order no longer meets the minimum for this promo code.",
  PROMO_NO_DISCOUNT: "This promo code doesn't give a discount on this order.",
};

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Please check your details.", field: issue?.path[0]?.toString() };
  }
  const order = parsed.data;

  const phone = normalizePhone(order.phone);
  if (!phone) {
    return { ok: false, error: "Please enter a valid phone number, e.g. 70 123 456.", field: "phone" };
  }

  if (!(await allowAttempt("checkout", 12, 3600))) {
    return { ok: false, error: "Too many orders from this connection. Please message us on WhatsApp." };
  }

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
    p_tracking_token_hash: sha256(order.trackingToken),
    p_customer_name: order.name,
    p_customer_phone: phone,
    p_customer_email: order.email || null,
    p_zone_id: order.zoneId,
    p_address: order.address,
    p_notes: order.notes,
    p_items: payload.items,
    p_promo_code: order.promoCode || null,
    p_expected_total_cents: order.expectedTotal,
  });

  if (error) {
    const message = error.code === "P0001" ? REJECTED[error.message] : undefined;
    if (message) return { ok: false, error: message, retry: error.message === "TOTAL_CHANGED" };
    console.error("Checkout failed:", error.code, error.message);
    return { ok: false, error: "We couldn't place your order. Please try again in a moment." };
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
  items: z
    .array(z.object({ name: z.string().max(140), label: z.string().max(40), quantity: z.number().int().min(1).max(99) }))
    .max(50),
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
        items: { name: string; label: string; quantity: number }[];
      };
    }
  | { ok: false; error: string };

export async function trackOrder(_prev: TrackResult | null, formData: FormData): Promise<TrackResult> {
  const number = z.coerce.number().int().min(1).max(100_000_000).safeParse(formData.get("number"));
  const phone = normalizePhone(String(formData.get("phone") ?? "").trim());

  if (!number.success || !phone) {
    return { ok: false, error: "Please enter your order number and the phone number you ordered with." };
  }

  if (!(await allowAttempt("track", 10, 3600))) {
    return { ok: false, error: "Too many attempts. Please try again later or message us on WhatsApp." };
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("orders")
    .select("order_number, status, created_at, total_cents, delivery_zone_name, order_items(product_name, variant_label, quantity)")
    .eq("order_number", number.data)
    .eq("customer_phone", phone)
    .maybeSingle();

  if (!data) {
    return { ok: false, error: "We couldn't find an order with these details. Please check and try again." };
  }

  return {
    ok: true,
    order: {
      number: data.order_number,
      status: data.status,
      createdAt: data.created_at,
      total: data.total_cents,
      zone: data.delivery_zone_name,
      items: (data.order_items ?? []).map((i) => ({ name: i.product_name, label: i.variant_label, quantity: i.quantity })),
    },
  };
}
