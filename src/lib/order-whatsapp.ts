import { money } from "@/lib/format";

export type WhatsAppOrder = {
  customerName: string;
  customerPhone: string;
  orderNumber: number;
  status: string;
  zone: string;
  totalCents: number;
  siteUrl: string | null;
};

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name.trim();

/** A ready-to-send WhatsApp message for each order status. */
export function orderWhatsAppMessage(order: WhatsAppOrder): string {
  const number = `#${order.orderNumber}`;
  const total = money(order.totalCents);
  const bodies: Record<string, string> = {
    pending: `Thank you for your order ${number}! 🌿 We received it and will confirm it shortly.`,
    confirmed: `Good news: your order ${number} is confirmed ✅ We're preparing it with love.`,
    preparing: `Your order ${number} is being prepared 🧺 We'll let you know when it's on its way.`,
    out_for_delivery: `Your order ${number} is on its way to ${order.zone} 🚚 Please have ${total} ready in cash for the driver.`,
    delivered: `Your order ${number} has been delivered 🎉 Thank you for choosing Ja'deer — you deserve this way of life 💚`,
    cancelled: `Your order ${number} has been cancelled. If you have any question, just reply to this message.`,
  };
  const lines = [`Hi ${firstName(order.customerName)}, this is Ja'deer Organics 🦌`, bodies[order.status] ?? `An update about your order ${number}.`];
  if (order.siteUrl && order.status !== "cancelled" && order.status !== "delivered") {
    lines.push(`Track your order anytime: ${order.siteUrl}/track`);
  }
  return lines.join("\n\n");
}

export function whatsAppHref(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
