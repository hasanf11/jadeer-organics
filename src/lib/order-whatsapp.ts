import { money } from "@/lib/format";

export type WhatsAppOrder = {
  customerName: string;
  customerPhone: string;
  orderNumber: number;
  status: string;
  zone: string;
  totalCents: number;
  locale: "en" | "ar";
  trackingUrl: string | null;
};

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name.trim();

/** A ready-to-send WhatsApp message for each order status, in the customer's language. */
export function orderWhatsAppMessage(order: WhatsAppOrder): string {
  const n = `#${order.orderNumber}`;
  const total = money(order.totalCents);
  const name = firstName(order.customerName);

  const en: Record<string, string> = {
    pending: `Thank you for your order ${n}! We received it and will confirm it shortly.`,
    confirmed: `Good news: your order ${n} is confirmed. We're preparing it with care.`,
    preparing: `Your order ${n} is being prepared. We'll let you know as soon as it's on its way.`,
    out_for_delivery: `Your order ${n} is on its way to ${order.zone}. Please have ${total} ready in cash for the driver.`,
    delivered: `Your order ${n} has been delivered. Thank you for choosing Ja'deer — you deserve this way of life.`,
    cancelled: `Your order ${n} has been cancelled. If you have any question, just reply to this message.`,
  };
  const ar: Record<string, string> = {
    pending: `شكراً لطلبك ${n}! استلمناه وسنؤكده قريباً.`,
    confirmed: `خبر جميل: تم تأكيد طلبك ${n} ونحضّره لك بكل عناية.`,
    preparing: `طلبك ${n} قيد التحضير. سنخبرك فور خروجه للتوصيل.`,
    out_for_delivery: `طلبك ${n} في الطريق إلى ${order.zone}. يرجى تحضير ${total} نقداً للسائق.`,
    delivered: `تم توصيل طلبك ${n}. شكراً لاختيارك جدير — أنت جدير بهذا النمط من الحياة.`,
    cancelled: `تم إلغاء طلبك ${n}. لأي سؤال، رد على هذه الرسالة.`,
  };

  const ar_ = order.locale === "ar";
  const lines = [
    ar_ ? `مرحباً ${name}، معك جدير أورغانيكس` : `Hi ${name}, this is Ja'deer Organics`,
    (ar_ ? ar : en)[order.status] ?? (ar_ ? `تحديث بخصوص طلبك ${n}.` : `An update about your order ${n}.`),
  ];
  if (order.trackingUrl && order.status !== "cancelled") {
    lines.push(ar_ ? `تابع طلبك من هنا: ${order.trackingUrl}` : `Follow your order here: ${order.trackingUrl}`);
  }
  return lines.join("\n\n");
}

export function whatsAppHref(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
