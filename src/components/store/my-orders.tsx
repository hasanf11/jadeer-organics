"use client";

import Link from "next/link";
import { PiArrowLeftBold, PiArrowRightBold, PiReceiptBold } from "react-icons/pi";
import { useI18n } from "@/components/i18n-provider";
import { formatDateTime, money } from "@/lib/format";
import { useMyOrders } from "@/lib/my-orders";

export default function MyOrders() {
  const { t, href, locale, rtl } = useI18n();
  const { orders, ready } = useMyOrders();
  const Arrow = rtl ? PiArrowLeftBold : PiArrowRightBold;

  if (!ready) return <div className="skeleton mt-8 h-40" />;

  return (
    <>
      {orders.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-butter p-10 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-white text-tomato">
            <PiReceiptBold size={28} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-2xl">{t.myOrders.empty}</h2>
          <p className="mt-1 text-ink-soft">{t.myOrders.emptyText}</p>
          <Link href={href("/shop")} className="btn btn-primary mt-6">{t.bag.startShopping}</Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3">
          {orders.map((order) => (
            <li key={order.token}>
              <Link href={href(`/order/${order.token}`)} className="flex items-center gap-4 rounded-3xl bg-paper p-5 shadow-soft transition-shadow hover:shadow-pop">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-leaf text-white">
                  <PiReceiptBold size={22} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{t.order.number(order.number)}</span>
                  <span className="text-sm text-ink-soft">{formatDateTime(order.date, locale)} · {money(order.total)}</span>
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-leaf">
                  {t.myOrders.view} <Arrow aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-8 text-sm text-ink-soft">
        {t.myOrders.other} <Link href={href("/track")} className="font-bold text-leaf underline">{t.myOrders.trackIt}</Link>
      </p>
    </>
  );
}
