"use server";

import { revalidatePath } from "next/cache";
import { adminClient, dbMessage, failure, id, refreshStore, success, text, type ActionState } from "@/lib/admin";

export async function setReviewStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const reviewId = id(formData);
  const status = text(formData, "status", 20);
  if (!reviewId || !["approved", "rejected", "pending", "delete"].includes(status)) return failure("Invalid request.");
  const { supabase } = await adminClient();
  const { error } =
    status === "delete"
      ? await supabase.from("reviews").delete().eq("id", reviewId)
      : await supabase.from("reviews").update({ status }).eq("id", reviewId);
  if (error) return failure(dbMessage(error));
  refreshStore();
  revalidatePath("/admin/reviews");
  return success(status === "approved" ? "Published on the product page" : status === "delete" ? "Deleted." : "Updated.");
}

export async function setMessageHandled(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const messageId = id(formData);
  const intent = text(formData, "intent", 20);
  if (!messageId) return failure("Invalid request.");
  const { supabase } = await adminClient();
  const { error } =
    intent === "delete"
      ? await supabase.from("contact_messages").delete().eq("id", messageId)
      : await supabase.from("contact_messages").update({ handled_at: intent === "reopen" ? null : new Date().toISOString() }).eq("id", messageId);
  if (error) return failure(dbMessage(error));
  revalidatePath("/admin/messages");
  return success("Updated.");
}

export async function markAlertNotified(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const alertId = id(formData);
  const intent = text(formData, "intent", 20);
  if (!alertId) return failure("Invalid request.");
  const { supabase } = await adminClient();
  const { error } =
    intent === "delete"
      ? await supabase.from("stock_alerts").delete().eq("id", alertId)
      : await supabase.from("stock_alerts").update({ notified_at: new Date().toISOString() }).eq("id", alertId);
  if (error) return failure(dbMessage(error));
  revalidatePath("/admin/stock-alerts");
  return success("Updated.");
}

export async function markLeadContacted(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const leadId = id(formData);
  const intent = text(formData, "intent", 20);
  if (!leadId) return failure("Invalid request.");
  const { supabase } = await adminClient();
  const { error } =
    intent === "delete"
      ? await supabase.from("checkout_leads").delete().eq("id", leadId)
      : await supabase.from("checkout_leads").update({ contacted_at: new Date().toISOString() }).eq("id", leadId);
  if (error) return failure(dbMessage(error));
  revalidatePath("/admin/checkouts");
  return success("Updated.");
}

export async function deleteSubscriber(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const subscriberId = id(formData);
  if (!subscriberId) return failure("Invalid request.");
  const { supabase } = await adminClient();
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", subscriberId);
  if (error) return failure(dbMessage(error));
  revalidatePath("/admin/newsletter");
  return success("Removed.");
}
