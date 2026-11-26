"use server";

import { revalidatePath } from "next/cache";
import { adminClient, dbMessage, failure, id, int, refreshStore, success, text, type ActionState } from "@/lib/admin";

export async function adjustStock(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const variantId = id(formData, "variant_id");
  const mode = text(formData, "mode", 20);
  const amount = int(formData, "amount");
  const note = text(formData, "note", 300);
  const current = int(formData, "current");
  if (!variantId) return failure("Invalid request.");

  let change = 0;
  let reason = "received";
  if (mode === "received") change = amount;
  else if (mode === "damaged") {
    change = -amount;
    reason = "damaged";
  } else if (mode === "set") {
    change = amount - current;
    reason = "correction";
  } else return failure("Invalid request.");

  if (mode !== "set" && amount <= 0) return failure("Enter a quantity above zero.");
  if (mode === "set" && amount < 0) return failure("Stock can't be negative.");
  if (change === 0) return success("No change needed.");

  const { supabase } = await adminClient();
  const { data, error } = await supabase.rpc("admin_adjust_stock", { p_variant_id: variantId, p_change: change, p_reason: reason, p_note: note });
  if (error) return failure(dbMessage(error, "Could not update stock."));

  refreshStore();
  revalidatePath("/admin/inventory");
  const productId = id(formData, "product_id");
  if (productId) revalidatePath(`/admin/products/${productId}`);
  return success(`Stock is now ${data}.`);
}
