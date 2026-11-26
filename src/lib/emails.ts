import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { localePath, type Locale } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/site";

// Emails are sent with Resend (https://resend.com). Nothing is sent until
// RESEND_API_KEY and ORDER_EMAIL_FROM are set, and a failed email never
// affects an order. Customers get emails in the language they ordered in.

export type OrderEmailKind = "placed" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";

type EmailOrder = {
  id: string;
  order_number: number;
  locale: Locale;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_zone_name: string;
  delivery_address: string;
  customer_notes: string;
  subtotal_cents: number;
  discount_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  promo_code: string | null;
  tracking_token: string | null;
  order_items: { product_name: string; variant_label: string; quantity: number; line_total_cents: number }[];
};

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ORDER_EMAIL_FROM);
}

async function send(payload: { to: string[]; subject: string; html: string; text: string; replyTo?: string; idempotencyKey?: string }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(payload.idempotencyKey ? { "Idempotency-Key": payload.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: process.env.ORDER_EMAIL_FROM,
      to: payload.to,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
    cache: "no-store",
  });
  if (!response.ok) console.error("Email failed. Status:", response.status);
}

const COPY = {
  en: {
    hi: (n: string) => `Hi ${n},`,
    track: "Track my order",
    private: "Keep this link private — anyone with it can view your order.",
    items: "Your order",
    subtotal: "Subtotal",
    delivery: "Delivery",
    discount: "Discount",
    total: "Total · cash on delivery",
    free: "Free",
    footer: "Ja'deer Organics · You deserve this way of life",
    kinds: {
      placed: (n: string, total: string) => ({ subject: `We received your order ${n}`, heading: "Thank you for your order!", lines: [`We've received your order ${n} totalling ${total}, cash on delivery.`, "We'll call or WhatsApp you shortly to confirm it."] }),
      confirmed: (n: string) => ({ subject: `Your order ${n} is confirmed`, heading: "Your order is confirmed.", lines: [`Good news: your order ${n} is confirmed and we're preparing it with care.`] }),
      preparing: (n: string) => ({ subject: `Your order ${n} is being prepared`, heading: "We're preparing your order.", lines: [`Your order ${n} is being packed. We'll let you know as soon as it's on its way.`] }),
      out_for_delivery: (n: string, total: string, zone: string) => ({ subject: `Your order ${n} is on its way`, heading: "Your order is on its way!", lines: [`Your order ${n} is on its way to ${zone}.`, `Please have ${total} ready in cash for the driver.`] }),
      delivered: (n: string) => ({ subject: `Your order ${n} has been delivered`, heading: "Delivered — enjoy!", lines: [`Your order ${n} has been delivered. Thank you for choosing Ja'deer — we'd love to hear what you think.`] }),
      cancelled: (n: string) => ({ subject: `Your order ${n} has been cancelled`, heading: "Your order has been cancelled.", lines: [`Your order ${n} has been cancelled.`, "If you didn't expect this, just reply to this email or message us on WhatsApp."] }),
    },
  },
  ar: {
    hi: (n: string) => `مرحباً ${n}،`,
    track: "تتبّع طلبي",
    private: "احتفظ بهذا الرابط لنفسك — يمكن لأي شخص يملكه رؤية طلبك.",
    items: "طلبك",
    subtotal: "المجموع الفرعي",
    delivery: "التوصيل",
    discount: "الخصم",
    total: "المجموع · الدفع عند الاستلام",
    free: "مجاني",
    footer: "جدير أورغانيكس · أنت جدير بهذا النمط من الحياة",
    kinds: {
      placed: (n: string, total: string) => ({ subject: `استلمنا طلبك ${n}`, heading: "شكراً لطلبك!", lines: [`استلمنا طلبك ${n} بقيمة ${total}، الدفع عند الاستلام.`, "سنتصل بك أو نراسلك على واتساب قريباً لتأكيده."] }),
      confirmed: (n: string) => ({ subject: `تم تأكيد طلبك ${n}`, heading: "تم تأكيد طلبك.", lines: [`خبر جميل: تم تأكيد طلبك ${n} ونحضّره لك بكل عناية.`] }),
      preparing: (n: string) => ({ subject: `طلبك ${n} قيد التحضير`, heading: "نحضّر طلبك الآن.", lines: [`طلبك ${n} قيد التغليف. سنخبرك فور خروجه للتوصيل.`] }),
      out_for_delivery: (n: string, total: string, zone: string) => ({ subject: `طلبك ${n} في الطريق إليك`, heading: "طلبك في الطريق!", lines: [`طلبك ${n} في الطريق إلى ${zone}.`, `يرجى تحضير ${total} نقداً للسائق.`] }),
      delivered: (n: string) => ({ subject: `تم توصيل طلبك ${n}`, heading: "تم التوصيل — بالهناء!", lines: [`تم توصيل طلبك ${n}. شكراً لاختيارك جدير — يسعدنا سماع رأيك.`] }),
      cancelled: (n: string) => ({ subject: `تم إلغاء طلبك ${n}`, heading: "تم إلغاء طلبك.", lines: [`تم إلغاء طلبك ${n}.`, "إذا لم تتوقع ذلك، رد على هذا البريد أو راسلنا على واتساب."] }),
    },
  },
} as const;

function layout(locale: Locale, inner: string): string {
  const origin = siteUrl();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
  <body style="margin:0;padding:0;background:#fbf6ec;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf6ec;padding:32px 14px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="${dir}" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;font-family:Tahoma,Arial,Helvetica,sans-serif;color:#1a1f1b;text-align:${align};">
          <tr><td style="background:#173f28;padding:24px 30px;">
            ${origin ? `<img src="${origin}/brand/icon-192.png" alt="" width="48" height="48" style="display:inline-block;border-radius:50%;vertical-align:middle;">` : ""}
            <span style="display:inline-block;vertical-align:middle;margin:0 12px;color:#fbf6ec;font-size:22px;font-weight:bold;">${locale === "ar" ? "جدير أورغانيكس" : "Ja'deer Organics"}</span>
          </td></tr>
          <tr><td style="padding:30px;">${inner}</td></tr>
          <tr><td style="padding:18px 30px;background:#f3eadb;font-size:12px;line-height:1.6;color:#5a5f58;">${escapeHtml(COPY[locale].footer)}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function itemsTable(order: EmailOrder, locale: Locale): string {
  const c = COPY[locale];
  const align = locale === "ar" ? "left" : "right";
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:6px 0;${strong ? "font-weight:bold;" : "color:#5a5f58;"}">${label}</td><td style="padding:6px 0;text-align:${align};${strong ? "font-weight:bold;" : "color:#5a5f58;"}">${value}</td></tr>`;
  return `<h2 style="margin:26px 0 8px;font-size:16px;">${c.items}</h2>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
    ${order.order_items
      .map((i) => `<tr><td style="padding:9px 0;border-bottom:1px solid #ebe0cc;"><strong>${escapeHtml(i.product_name)}</strong><br><span style="color:#5a5f58;font-size:13px;">${escapeHtml(i.variant_label)} × ${i.quantity}</span></td><td style="padding:9px 0;border-bottom:1px solid #ebe0cc;text-align:${align};white-space:nowrap;">${money(i.line_total_cents)}</td></tr>`)
      .join("")}
    ${row(c.subtotal, money(order.subtotal_cents))}
    ${row(c.delivery, order.delivery_fee_cents ? money(order.delivery_fee_cents) : c.free)}
    ${order.discount_cents ? row(`${c.discount}${order.promo_code ? ` (${escapeHtml(order.promo_code)})` : ""}`, `−${money(order.discount_cents)}`) : ""}
    ${row(c.total, money(order.total_cents), true)}
  </table>`;
}

async function loadOrder(orderId: string): Promise<EmailOrder | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, locale, customer_name, customer_phone, customer_email, delivery_zone_name, delivery_address, customer_notes, subtotal_cents, discount_cents, delivery_fee_cents, total_cents, promo_code, tracking_token, order_items(product_name, variant_label, quantity, line_total_cents)",
    )
    .eq("id", orderId)
    .maybeSingle();
  return (data as EmailOrder | null) ?? null;
}

export function orderTrackingUrl(locale: Locale, token: string | null): string | null {
  const origin = siteUrl();
  return origin && token ? `${origin}${localePath(locale, `/order/${token}`)}` : null;
}

/** Email the customer about their order (never throws). */
export async function sendOrderEmail(orderId: string, kind: OrderEmailKind, options: { resend?: boolean } = {}): Promise<void> {
  if (!emailConfigured()) return;
  try {
    const order = await loadOrder(orderId);
    if (!order?.customer_email) return;

    const supabase = createServiceClient();
    if (kind === "placed") {
      const { data: claimed } = await supabase
        .from("orders")
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq("id", orderId)
        .is("confirmation_email_sent_at", null)
        .select("id");
      if (!claimed?.length) return;
    }

    const { data: store } = await supabase.from("store_settings").select("email, whatsapp").eq("id", 1).maybeSingle();
    const locale: Locale = order.locale === "ar" ? "ar" : "en";
    const c = COPY[locale];
    const number = `#${order.order_number}`;
    const content = c.kinds[kind](number, money(order.total_cents), order.delivery_zone_name);
    const tracking = kind === "cancelled" ? null : orderTrackingUrl(locale, order.tracking_token);

    const inner = `
      <h1 style="margin:0 0 18px;font-size:24px;line-height:1.3;">${escapeHtml(content.heading)}</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">${escapeHtml(c.hi(firstName(order.customer_name)))}</p>
      ${content.lines.map((line) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;">${escapeHtml(line)}</p>`).join("")}
      ${kind === "placed" ? itemsTable(order, locale) : ""}
      ${tracking ? `<p style="margin:28px 0 10px;"><a href="${escapeHtml(tracking)}" style="display:inline-block;padding:14px 28px;background:#1f5a36;color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:bold;">${c.track}</a></p><p style="margin:0;font-size:12px;color:#5a5f58;">${escapeHtml(c.private)}</p>` : ""}
      ${store?.whatsapp ? `<p style="margin:22px 0 0;font-size:13px;color:#5a5f58;">WhatsApp: <a href="https://wa.me/${store.whatsapp.replace(/\D/g, "")}" style="color:#1f5a36;">${escapeHtml(store.whatsapp)}</a></p>` : ""}`;

    const text = [
      c.hi(firstName(order.customer_name)),
      "",
      ...content.lines,
      ...(kind === "placed" ? ["", ...order.order_items.map((i) => `- ${i.product_name} (${i.variant_label}) × ${i.quantity}: ${money(i.line_total_cents)}`), `${c.total}: ${money(order.total_cents)}`] : []),
      ...(tracking ? ["", `${c.track}: ${tracking}`] : []),
      "",
      c.footer,
    ].join("\n");

    await send({
      to: [order.customer_email],
      subject: content.subject,
      html: layout(locale, inner),
      text,
      replyTo: store?.email || undefined,
      idempotencyKey: options.resend ? undefined : `order-${orderId}-${kind}`,
    });
  } catch {
    console.error(`Order email (${kind}) could not be sent.`);
  }
}

async function shopInbox(): Promise<string | null> {
  if (process.env.SHOP_NOTIFY_EMAIL) return process.env.SHOP_NOTIFY_EMAIL;
  const supabase = createServiceClient();
  const { data } = await supabase.from("store_settings").select("email").eq("id", 1).maybeSingle();
  return data?.email || null;
}

/** Tell the shop about a new order (never throws). */
export async function notifyShopOfOrder(orderId: string): Promise<void> {
  if (!emailConfigured()) return;
  try {
    const [order, inbox] = await Promise.all([loadOrder(orderId), shopInbox()]);
    if (!order || !inbox) return;
    const origin = siteUrl();
    const whatsapp = `https://wa.me/${order.customer_phone.replace(/\D/g, "")}`;
    const inner = `
      <h1 style="margin:0 0 6px;font-size:22px;">New order #${order.order_number} · ${money(order.total_cents)}</h1>
      <p style="margin:0 0 16px;color:#5a5f58;">${escapeHtml(order.customer_name)} · ${escapeHtml(order.customer_phone)} · ${escapeHtml(order.delivery_zone_name)} · ${order.locale === "ar" ? "Arabic site" : "English site"}</p>
      <p style="margin:0 0 6px;"><strong>Address:</strong> ${escapeHtml(order.delivery_address)}</p>
      ${order.customer_notes ? `<p style="margin:0 0 6px;"><strong>Note:</strong> ${escapeHtml(order.customer_notes)}</p>` : ""}
      ${itemsTable(order, "en")}
      <p style="margin:26px 0 0;">
        ${origin ? `<a href="${origin}/admin/orders/${order.id}" style="display:inline-block;padding:12px 22px;background:#1f5a36;color:#fff;text-decoration:none;border-radius:999px;font-weight:bold;">Open in admin</a>` : ""}
        <a href="${whatsapp}" style="display:inline-block;margin:0 8px;padding:12px 22px;background:#1f8f4e;color:#fff;text-decoration:none;border-radius:999px;font-weight:bold;">WhatsApp customer</a>
      </p>`;
    await send({
      to: [inbox],
      subject: `New order #${order.order_number} — ${money(order.total_cents)} — ${order.customer_name}`,
      html: layout("en", inner),
      text: `New order #${order.order_number} from ${order.customer_name} (${order.customer_phone}), ${order.delivery_zone_name}. Total ${money(order.total_cents)}.${origin ? ` ${origin}/admin/orders/${order.id}` : ""}`,
      replyTo: order.customer_email ?? undefined,
      idempotencyKey: `shop-order-${orderId}`,
    });
  } catch {
    console.error("Shop order notification could not be sent.");
  }
}

/** Tell the shop about a new contact message (never throws). */
export async function notifyShopOfMessage(message: { name: string; phone: string; email: string; topic: string; message: string }): Promise<void> {
  if (!emailConfigured()) return;
  try {
    const inbox = await shopInbox();
    if (!inbox) return;
    const origin = siteUrl();
    const inner = `
      <h1 style="margin:0 0 6px;font-size:22px;">New message (${escapeHtml(message.topic)})</h1>
      <p style="margin:0 0 16px;color:#5a5f58;">${escapeHtml(message.name)}${message.phone ? ` · ${escapeHtml(message.phone)}` : ""}${message.email ? ` · ${escapeHtml(message.email)}` : ""}</p>
      <p style="white-space:pre-line;font-size:15px;line-height:1.7;">${escapeHtml(message.message)}</p>
      ${origin ? `<p style="margin-top:22px;"><a href="${origin}/admin/messages" style="display:inline-block;padding:12px 22px;background:#1f5a36;color:#fff;text-decoration:none;border-radius:999px;font-weight:bold;">Open messages</a></p>` : ""}`;
    await send({
      to: [inbox],
      subject: `New ${message.topic} message from ${message.name}`,
      html: layout("en", inner),
      text: `${message.name} (${message.phone || message.email}): ${message.message}`,
      replyTo: message.email || undefined,
    });
  } catch {
    console.error("Shop message notification could not be sent.");
  }
}
