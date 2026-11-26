import { getCurrentAdmin } from "@/lib/auth";
import { excelResponse } from "@/lib/excel";
import { ORDER_STATUSES, PAYMENT_INFO, STATUS_INFO } from "@/lib/order-status";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return new Response("Not allowed", { status: 403 });

  const status = new URL(request.url).searchParams.get("status");
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("order_number, created_at, customer_name, customer_phone, customer_email, delivery_zone_name, delivery_address, subtotal_cents, delivery_fee_cents, discount_cents, total_cents, promo_code, status, payment_status, customer_notes, order_items(product_name, variant_label, quantity)")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (status && ORDER_STATUSES.includes(status as never)) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return new Response("Could not export orders", { status: 500 });

  const date = new Date().toISOString().slice(0, 10);
  return excelResponse(
    `jadeer-orders-${date}.xlsx`,
    "Orders",
    [
      { header: "Order", key: "number", width: 10 },
      { header: "Date", key: "date", width: 20 },
      { header: "Customer", key: "name", width: 22 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Email", key: "email", width: 24 },
      { header: "Area", key: "zone", width: 24 },
      { header: "Address", key: "address", width: 40 },
      { header: "Items", key: "items", width: 50 },
      { header: "Subtotal ($)", key: "subtotal", width: 12 },
      { header: "Delivery ($)", key: "delivery", width: 12 },
      { header: "Discount ($)", key: "discount", width: 12 },
      { header: "Total ($)", key: "total", width: 12 },
      { header: "Promo", key: "promo", width: 12 },
      { header: "Status", key: "status", width: 16 },
      { header: "Payment", key: "payment", width: 12 },
      { header: "Note", key: "notes", width: 30 },
    ],
    (data ?? []).map((o) => ({
      number: o.order_number,
      date: new Date(o.created_at).toLocaleString("en-GB", { timeZone: "Asia/Beirut" }),
      name: o.customer_name,
      phone: o.customer_phone,
      email: o.customer_email ?? "",
      zone: o.delivery_zone_name,
      address: o.delivery_address,
      items: o.order_items.map((i) => `${i.quantity}× ${i.product_name} (${i.variant_label})`).join(", "),
      subtotal: o.subtotal_cents / 100,
      delivery: o.delivery_fee_cents / 100,
      discount: o.discount_cents / 100,
      total: o.total_cents / 100,
      promo: o.promo_code ?? "",
      status: STATUS_INFO[o.status]?.label ?? o.status,
      payment: PAYMENT_INFO[o.payment_status]?.label ?? o.payment_status,
      notes: o.customer_notes,
    })),
  );
}
