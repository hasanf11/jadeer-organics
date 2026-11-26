"use server";

import { revalidatePath } from "next/cache";
import { adminClient, checkbox, dbMessage, failure, id, int, refreshStore, success, text, type ActionState } from "@/lib/admin";
import { parseDollars, slugify } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";

const HEX = /^#[0-9a-f]{6}$/i;

type Table = "categories" | "store_locations" | "delivery_zones" | "retail_partners" | "promotions";

async function save(table: Table, path: string, formData: FormData, values: Record<string, unknown>, label: string): Promise<ActionState> {
  const rowId = id(formData);
  const { supabase } = await adminClient();
  const { error } = rowId
    ? await supabase.from(table).update(values).eq("id", rowId)
    : await supabase.from(table).insert(values);
  if (error) return failure(dbMessage(error, `Could not save the ${label}.`));
  refreshStore();
  revalidatePath(path);
  return success(rowId ? "Saved." : `${label[0].toUpperCase()}${label.slice(1)} added.`);
}

async function remove(table: Table, path: string, formData: FormData, label: string): Promise<ActionState> {
  const rowId = id(formData);
  if (!rowId) return failure("Invalid request.");
  const { supabase } = await adminClient();
  const { error } = await supabase.from(table).delete().eq("id", rowId);
  if (error) return failure(dbMessage(error, `Could not delete the ${label}.`));
  refreshStore();
  revalidatePath(path);
  return success("Deleted.");
}

// Categories -----------------------------------------------------------

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = text(formData, "name", 80);
  if (!name) return failure("Please enter a name.");
  const color = text(formData, "color", 7);
  return save("categories", "/admin/categories", formData, {
    name,
    name_ar: text(formData, "name_ar", 80),
    slug: slugify(text(formData, "slug", 90) || name),
    description: text(formData, "description", 1000),
    color: HEX.test(color) ? color : "#2f8f3a",
    emoji: text(formData, "emoji", 8) || "🌿",
    is_active: checkbox(formData, "is_active"),
    sort_order: Math.max(0, int(formData, "sort_order")),
  }, "category");
}

export async function deleteCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return remove("categories", "/admin/categories", formData, "category");
}

// Stores ---------------------------------------------------------------

function coordinate(value: string, limit: number): number | null | "bad" {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : "bad";
}

/** Accept "33.8564, 35.5066" or a Google Maps link containing @lat,lng or q=lat,lng. */
function parseLocation(raw: string): { lat: number; lng: number } | null {
  const match = raw.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

export async function saveStore(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = text(formData, "name", 80);
  if (!name) return failure("Please enter the store name.");

  let latitude = coordinate(text(formData, "latitude", 20), 90);
  let longitude = coordinate(text(formData, "longitude", 20), 180);
  const pasted = text(formData, "maps_link", 500);
  if (pasted) {
    const parsed = parseLocation(decodeURIComponent(pasted));
    if (!parsed) return failure("Couldn't read coordinates from that link. Paste a link with the location pin, or type latitude and longitude.");
    latitude = parsed.lat;
    longitude = parsed.lng;
  }
  if (latitude === "bad" || longitude === "bad") return failure("Latitude/longitude look wrong.");
  if ((latitude == null) !== (longitude == null)) return failure("Enter both latitude and longitude, or neither.");

  return save("store_locations", "/admin/stores", formData, {
    name,
    name_ar: text(formData, "name_ar", 80),
    area: text(formData, "area", 80),
    address: text(formData, "address", 300),
    phone: text(formData, "phone", 40),
    hours: text(formData, "hours", 200),
    latitude,
    longitude,
    maps_query: text(formData, "maps_query", 200),
    is_active: checkbox(formData, "is_active"),
    sort_order: Math.max(0, int(formData, "sort_order")),
  }, "store");
}

export async function deleteStore(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return remove("store_locations", "/admin/stores", formData, "store");
}

// Delivery zones -------------------------------------------------------

export async function saveZone(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = text(formData, "name", 80);
  const fee = parseDollars(formData.get("fee"));
  if (!name) return failure("Please enter the area name.");
  if (fee == null) return failure("Please enter a fee, e.g. 3 or 0 for free.");
  return save("delivery_zones", "/admin/delivery", formData, {
    name,
    fee_cents: fee,
    eta: text(formData, "eta", 60),
    is_active: checkbox(formData, "is_active"),
    sort_order: Math.max(0, int(formData, "sort_order")),
  }, "delivery area");
}

export async function deleteZone(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return remove("delivery_zones", "/admin/delivery", formData, "delivery area");
}

// Retail partners ------------------------------------------------------

export async function savePartner(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = text(formData, "name", 80);
  const url = text(formData, "url", 300);
  if (!name) return failure("Please enter a name.");
  if (url && !/^https:\/\/[^\s]+$/i.test(url)) return failure("The website must start with https://");
  return save("retail_partners", "/admin/partners", formData, {
    name,
    url,
    is_active: checkbox(formData, "is_active"),
    sort_order: Math.max(0, int(formData, "sort_order")),
  }, "partner");
}

export async function deletePartner(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return remove("retail_partners", "/admin/partners", formData, "partner");
}

// Promo codes ----------------------------------------------------------

export async function savePromotion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const code = text(formData, "code", 30).toUpperCase().replace(/\s+/g, "");
  const kind = text(formData, "kind", 20);
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return failure("Codes use 3–30 letters, numbers, - or _.");
  if (!["percent", "fixed", "free_delivery"].includes(kind)) return failure("Choose a discount type.");

  let value = 0;
  if (kind === "percent") {
    value = int(formData, "value");
    if (value < 1 || value > 90) return failure("Percentage must be between 1 and 90.");
  } else if (kind === "fixed") {
    const amount = parseDollars(formData.get("value"));
    if (!amount) return failure("Enter the discount amount in dollars.");
    value = amount;
  }

  const minimum = text(formData, "min_order", 12) ? parseDollars(formData.get("min_order")) : 0;
  if (minimum == null) return failure("Minimum order looks wrong.");
  const maxUses = int(formData, "max_uses");
  const starts = text(formData, "starts_at", 30);
  const ends = text(formData, "ends_at", 30);

  return save("promotions", "/admin/promotions", formData, {
    code,
    description: text(formData, "description", 200),
    kind,
    value,
    min_order_cents: minimum,
    max_uses: maxUses > 0 ? maxUses : null,
    starts_at: starts ? new Date(`${starts}T00:00:00+02:00`).toISOString() : null,
    ends_at: ends ? new Date(`${ends}T23:59:59+02:00`).toISOString() : null,
    is_active: checkbox(formData, "is_active"),
  }, "promo code");
}

export async function deletePromotion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return remove("promotions", "/admin/promotions", formData, "promo code");
}

// Settings -------------------------------------------------------------

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const whatsappRaw = text(formData, "whatsapp", 40);
  const whatsapp = whatsappRaw ? normalizePhone(whatsappRaw) : "";
  if (whatsapp === null) return failure("The WhatsApp number looks wrong. Example: 70 123 456");
  const email = text(formData, "email", 254);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return failure("The email looks wrong.");
  for (const key of ["instagram_url", "facebook_url", "tiktok_url"]) {
    const url = text(formData, key, 300);
    if (url && !/^https:\/\//i.test(url)) return failure("Social links must start with https://");
  }
  const threshold = text(formData, "free_delivery", 12) ? parseDollars(formData.get("free_delivery")) : 0;
  const minimum = text(formData, "min_order", 12) ? parseDollars(formData.get("min_order")) : 0;
  if (threshold == null || minimum == null) return failure("Amounts must look like 50 or 49.99");

  const { supabase } = await adminClient();
  const { error } = await supabase
    .from("store_settings")
    .update({
      store_name: text(formData, "store_name", 80) || "Ja'deer Organics",
      tagline: text(formData, "tagline", 200),
      phone: text(formData, "phone", 40),
      whatsapp,
      email: email.toLowerCase(),
      instagram_url: text(formData, "instagram_url", 300),
      facebook_url: text(formData, "facebook_url", 300),
      tiktok_url: text(formData, "tiktok_url", 300),
      announcement_enabled: checkbox(formData, "announcement_enabled"),
      announcement_text: text(formData, "announcement_text", 200),
      free_delivery_threshold_cents: threshold,
      min_order_cents: minimum,
      low_stock_threshold: Math.min(1000, Math.max(0, int(formData, "low_stock_threshold", 5))),
      accepting_orders: checkbox(formData, "accepting_orders"),
      order_notice: text(formData, "order_notice", 300),
    })
    .eq("id", 1);
  if (error) return failure(dbMessage(error, "Could not save settings."));

  refreshStore();
  revalidatePath("/admin/settings");
  return success("Settings saved — the shop is updated.");
}
