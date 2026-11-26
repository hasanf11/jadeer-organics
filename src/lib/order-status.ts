export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_INFO: Record<string, { label: string; customer: string; color: string; bg: string }> = {
  pending: { label: "New", customer: "Order received", color: "#7a5a1d", bg: "#f4ecd6" },
  confirmed: { label: "Confirmed", customer: "Confirmed", color: "#2d6764", bg: "#e0ecea" },
  preparing: { label: "Preparing", customer: "Being prepared", color: "#4b3f7a", bg: "#e9e6f2" },
  out_for_delivery: { label: "Out for delivery", customer: "On its way", color: "#8f4426", bg: "#f5e7df" },
  delivered: { label: "Delivered", customer: "Delivered", color: "#2e5e35", bg: "#e6eee0" },
  cancelled: { label: "Cancelled", customer: "Cancelled", color: "#8a2f2f", bg: "#f4e4e2" },
};

export const PAYMENT_INFO: Record<string, { label: string; color: string; bg: string }> = {
  unpaid: { label: "Unpaid", color: "#7a5a1d", bg: "#f4ecd6" },
  paid: { label: "Paid", color: "#2e5e35", bg: "#e6eee0" },
  refunded: { label: "Refunded", color: "#5d6259", bg: "#ece8e0" },
};

/** The happy path shown to customers as a progress tracker. */
export const CUSTOMER_STEPS: OrderStatus[] = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];
