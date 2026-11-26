"use server";

import { revalidatePath, updateTag } from "next/cache";
import { adminClient, dbMessage, failure, id, success, text, type ActionState } from "@/lib/admin";
import { ORDER_STATUSES } from "@/lib/order-status";

export async function setOrderStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orderId = id(formData);
  const status = text(formData, "status", 30);
  const note = text(formData, "note", 300);
  if (!orderId || !ORDER_STATUSES.includes(status as never)) return failure("Invalid request.");

  const { supabase } = await adminClient();
  const { error } = await supabase.rpc("admin_set_order_status", { p_order_id: orderId, p_status: status, p_note: note });
  if (error) return failure(dbMessage(error, "Could not update the order."));

  // Cancelling or reopening changes stock shown in the shop.
  updateTag("catalog");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return success("Order updated.");
}

export async function setOrderPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orderId = id(formData);
  const payment = text(formData, "payment", 20);
  if (!orderId || !["unpaid", "paid", "refunded"].includes(payment)) return failure("Invalid request.");

  const { supabase } = await adminClient();
  const { error } = await supabase.rpc("admin_set_order_payment", { p_order_id: orderId, p_payment: payment });
  if (error) return failure(dbMessage(error, "Could not update the payment."));

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return success("Payment updated.");
}

export async function saveOrderNotes(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orderId = id(formData);
  if (!orderId) return failure("Invalid request.");
  const notes = text(formData, "admin_notes", 2000);

  const { supabase } = await adminClient();
  const { error } = await supabase.from("orders").update({ admin_notes: notes }).eq("id", orderId);
  if (error) return failure(dbMessage(error, "Could not save the note."));

  revalidatePath(`/admin/orders/${orderId}`);
  return success("Note saved.");
}
