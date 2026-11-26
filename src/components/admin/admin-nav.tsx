"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PiBellRingingBold,
  PiChartBarBold,
  PiChatCircleDotsBold,
  PiEnvelopeSimpleBold,
  PiGearBold,
  PiHandshakeBold,
  PiListBold,
  PiMapPinBold,
  PiPackageBold,
  PiReceiptBold,
  PiShoppingCartBold,
  PiSquaresFourBold,
  PiStackBold,
  PiStarBold,
  PiTagBold,
  PiTruckBold,
  PiUsersBold,
  PiXBold,
} from "react-icons/pi";

export type NavCounts = { orders: number; messages: number; reviews: number; alerts: number; checkouts: number };

const groups = [
  {
    title: "Sell",
    items: [
      { href: "/admin", label: "Dashboard", icon: PiChartBarBold },
      { href: "/admin/orders", label: "Orders", icon: PiReceiptBold, badge: "orders" },
      { href: "/admin/customers", label: "Customers", icon: PiUsersBold },
      { href: "/admin/checkouts", label: "Unfinished checkouts", icon: PiShoppingCartBold, badge: "checkouts" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: PiPackageBold },
      { href: "/admin/inventory", label: "Inventory", icon: PiStackBold },
      { href: "/admin/categories", label: "Categories", icon: PiSquaresFourBold },
      { href: "/admin/promotions", label: "Promo codes", icon: PiTagBold },
      { href: "/admin/reviews", label: "Reviews", icon: PiStarBold, badge: "reviews" },
    ],
  },
  {
    title: "Customers care",
    items: [
      { href: "/admin/messages", label: "Messages", icon: PiChatCircleDotsBold, badge: "messages" },
      { href: "/admin/stock-alerts", label: "Stock alerts", icon: PiBellRingingBold, badge: "alerts" },
      { href: "/admin/newsletter", label: "Mailing list", icon: PiEnvelopeSimpleBold },
    ],
  },
  {
    title: "Shop setup",
    items: [
      { href: "/admin/stores", label: "Stores & maps", icon: PiMapPinBold },
      { href: "/admin/delivery", label: "Delivery areas", icon: PiTruckBold },
      { href: "/admin/partners", label: "Retail partners", icon: PiHandshakeBold },
      { href: "/admin/settings", label: "Settings", icon: PiGearBold },
    ],
  },
] as const;

function Links({ pathname, counts, onNavigate }: { pathname: string; counts: NavCounts; onNavigate?: () => void }) {
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav aria-label="Administration" className="grid gap-5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-3 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-soft/70">{group.title}</p>
          <ul className="grid gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const count = "badge" in item ? counts[item.badge as keyof NavCounts] : 0;
              const isActive = active(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-semibold transition-colors ${
                      isActive ? "bg-leaf text-white shadow-soft" : "text-ink hover:bg-cream"
                    }`}
                  >
                    <Icon size={19} className={isActive ? "" : "text-leaf"} />
                    <span className="flex-1">{item.label}</span>
                    {count > 0 && (
                      <span className={`grid min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold ${isActive ? "bg-white text-leaf" : "bg-tomato text-white"}`}>
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function AdminNav({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const total = counts.orders + counts.messages + counts.reviews + counts.alerts + counts.checkouts;

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <aside className="no-print sticky top-[4.5rem] hidden h-[calc(100dvh-4.5rem)] w-64 shrink-0 overflow-y-auto border-r border-line bg-white px-3 py-5 lg:block">
        <Links pathname={pathname} counts={counts} />
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-ink px-5 py-3.5 font-bold text-cream shadow-pop lg:hidden"
        aria-label="Open admin menu"
      >
        <PiListBold size={20} /> Menu
        {total > 0 && <span className="grid min-w-6 place-items-center rounded-full bg-tomato px-1.5 text-xs">{total}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-xs overflow-y-auto bg-white px-3 pb-8 pt-4 shadow-pop">
            <div className="mb-4 flex justify-end">
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close menu">
                <PiXBold size={22} />
              </button>
            </div>
            <Links pathname={pathname} counts={counts} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
