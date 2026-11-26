export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_INFO: Record<string, { label: string; customer: string; emoji: string; color: string; bg: string }> = {
  pending: { label: "New", customer: "Order received", emoji: "📝", color: "#8a5a00", bg: "#fff0b8" },
  confirmed: { label: "Confirmed", customer: "Confirmed", emoji: "✅", color: "#0b6e70", bg: "#d8f2f0" },
  preparing: { label: "Preparing", customer: "Being prepared", emoji: "🧺", color: "#5b21b6", bg: "#ede4ff" },
  out_for_delivery: { label: "Out for delivery", customer: "On its way", emoji: "🚚", color: "#b0390a", bg: "#ffe6d5" },
  delivered: { label: "Delivered", customer: "Delivered", emoji: "🎉", color: "#23752e", bg: "#e3f4d8" },
  cancelled: { label: "Cancelled", customer: "Cancelled", emoji: "✖️", color: "#a91b1b", bg: "#fde4e4" },
};

export const PAYMENT_INFO: Record<string, { label: string; color: string; bg: string }> = {
  unpaid: { label: "Unpaid", color: "#8a5a00", bg: "#fff0b8" },
  paid: { label: "Paid", color: "#23752e", bg: "#e3f4d8" },
  refunded: { label: "Refunded", color: "#5b4a43", bg: "#efe6da" },
};

/** The happy path shown to customers as a progress tracker. */
export const CUSTOMER_STEPS: OrderStatus[] = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];
