"use client";

import Link from "next/link";
import { useState } from "react";
import { PiArrowRightBold } from "react-icons/pi";
import ProductCard, { type CardProduct } from "@/components/store/product-card";

type Tab = { key: string; label: string; products: CardProduct[] };

export default function FeaturedTabs({ tabs, lowStockThreshold }: { tabs: Tab[]; lowStockThreshold: number }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  if (!current) return null;

  return (
    <div>
      <div role="tablist" aria-label="Product groups" className="scrollbar-none -mx-5 flex gap-7 overflow-x-auto border-b border-line px-5 md:mx-0 md:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === current.key}
            onClick={() => setActive(tab.key)}
            className={`relative shrink-0 pb-3 text-sm font-semibold transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:transition-colors ${
              tab.key === current.key ? "text-ink after:bg-ink" : "text-ink-soft after:bg-transparent hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" key={current.key} className="mt-8 grid animate-pop grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
        {current.products.slice(0, 8).map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 2} lowStockThreshold={lowStockThreshold} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/shop" className="btn btn-ghost">
          See all products <PiArrowRightBold />
        </Link>
      </div>
    </div>
  );
}
