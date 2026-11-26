"use client";

import Link from "next/link";
import { useState } from "react";
import { PiArrowLeftBold, PiArrowRightBold } from "react-icons/pi";
import ProductCard, { type CardProduct } from "@/components/store/product-card";
import { useI18n } from "@/components/i18n-provider";

type Tab = { key: string; label: string; products: CardProduct[] };

export default function FeaturedTabs({ tabs, lowStockThreshold }: { tabs: Tab[]; lowStockThreshold: number }) {
  const { t, href, rtl } = useI18n();
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((tab) => tab.key === active) ?? tabs[0];
  const Arrow = rtl ? PiArrowLeftBold : PiArrowRightBold;
  if (!current) return null;

  return (
    <div>
      <div role="tablist" aria-label={t.home.favouritesTitle} className="scroll-row -mx-[1.15rem] gap-2 px-[1.15rem] pb-1 md:mx-0 md:flex-wrap md:px-0">
        {tabs.map((tab) => {
          const on = tab.key === current.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(tab.key)}
              className={`chip shrink-0 px-4 py-2.5 text-[0.85rem] transition-colors ${on ? "bg-leaf text-white" : "bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:shadow-[inset_0_0_0_1.5px_var(--color-leaf)]"}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" key={current.key} className="mt-7 grid animate-pop grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {current.products.slice(0, 8).map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 2} lowStockThreshold={lowStockThreshold} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href={href("/shop")} className="btn btn-ghost">
          {t.common.viewAll} <Arrow />
        </Link>
      </div>
    </div>
  );
}
