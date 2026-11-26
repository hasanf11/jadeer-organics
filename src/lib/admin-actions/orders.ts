"use server";

import { revalidatePath, updateTag } from "next/cache";
import { after } from "next/server";
import { adminClient, dbMessage, failure, id, success, text, type ActionState } from "@/lib/admin";
import { sendOrderEmail, type OrderEmailKind } from "@/lib/emails";
import { ORDER_STATUSES } from "@/lib/order-status";

const EMAIL_STATUSES = new Set(["confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function setOrderStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orderId = id(formData);
  const status = text(formData, "status", 30);
  const note = text(formData, "note", 300);
  if (!orderId || !ORDER_STATUSES.includes(status as never)) return failure("Invalid request.");

  const { supabase } = await adminClient();
  const { error } = await supabase.rpc("admin_set_order_status", { p_order_id: orderId, p_status: status, p_note: note });
  if (error) return failure(dbMessage(error, "Could not update the order."));

  // Email the customer about the new step (if they gave an email).
  if (EMAIL_STATUSES.has(status)) after(() => sendOrderEmail(orderId, status as OrderEmailKind));

  updateTag("catalog");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return success("Order updated. The customer was emailed if they gave an email — send the WhatsApp message too.");
}

/** Move several orders to the same step at once. */
export async function bulkSetOrderStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const status = text(formData, "status", 30);
  const ids = Array.from(new Set(formData.getAll("ids").filter((v): v is string => typeof v === "string" && UUID.test(v)))).slice(0, 200);
  if (!ORDER_STATUSES.includes(status as never)) return failure("Choose a status.");
  if (!ids.length) return failure("Select at least one order.");

  const { supabase } = await adminClient();
  let done = 0;
  const failed: string[] = [];
  for (const orderId of ids) {
    const { error } = await supabase.rpc("admin_set_order_status", { p_order_id: orderId, p_status: status, p_note: "bulk update" });
    if (error) failed.push(dbMessage(error, "error"));
    else {
      done += 1;
      if (EMAIL_STATUSES.has(status)) after(() => sendOrderEmail(orderId, status as OrderEmailKind));
    }
  }

  updateTag("catalog");
  revalidatePath("/admin/orders");
  return failed.length ? failure(`${done} updated, ${failed.length} could not be updated (${failed[0]}).`) : success(`${done} order${done === 1 ? "" : "s"} updated.`);
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

/** Send the order email again (e.g. the customer can't find it). */
export async function resendOrderEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orderId = id(formData);
  const kind = text(formData, "kind", 30);
  if (!orderId || !["confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"].includes(kind)) return failure("Invalid request.");
  await adminClient();
  await sendOrderEmail(orderId, kind as OrderEmailKind, { resend: true });
  return success("Email sent (if email is configured and the customer gave an email).");
}
