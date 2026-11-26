import "server-only";

import { revalidatePath, updateTag } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { ok: boolean; message: string };

export const IDLE: ActionState = { ok: false, message: "" };

/**
 * Every admin action starts here: it checks the signed-in user is an
 * active administrator and returns their database client (row level
 * security applies on top of this check).
 */
export async function adminClient() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Your session has ended. Please sign in again.");
  return { admin, supabase: await createClient() };
}

/** Refresh the storefront after catalog changes. */
export function refreshStore() {
  updateTag("catalog");
  updateTag("reviews");
}

export function refreshAdmin(path: string) {
  revalidatePath(path);
}

export function failure(message: string): ActionState {
  return { ok: false, message };
}

export function success(message: string): ActionState {
  return { ok: true, message };
}

/** Friendly text for database errors. */
export function dbMessage(error: { code?: string; message?: string } | null, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  if (error.code === "23505") return "That name, slug or code is already used.";
  if (error.code === "23503") return "This item is still used elsewhere, so it can't be deleted. Hide or archive it instead.";
  if (error.code === "23514") return "Some values are not allowed. Please check the form.";
  if (error.code === "42501") return "You don't have permission to do that.";
  if (error.message === "INSUFFICIENT_STOCK") return "Not enough stock to reopen this order.";
  if (error.message === "NEGATIVE_STOCK") return "Stock can't go below zero.";
  return fallback;
}

export function text(formData: FormData, key: string, max = 1000): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function checkbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export function int(formData: FormData, key: string, fallback = 0): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function id(formData: FormData, key = "id"): string | null {
  const value = formData.get(key);
  return typeof value === "string" && UUID.test(value) ? value : null;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
