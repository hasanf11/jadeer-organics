"use client";

import Link from "next/link";
import { useState } from "react";
import { PiArrowRightBold } from "react-icons/pi";
import ProductCard, { type CardProduct } from "@/components/store/product-card";

type Tab = { key: string; label: string; emoji: string; products: CardProduct[] };

export default function FeaturedTabs({ tabs, lowStockThreshold }: { tabs: Tab[]; lowStockThreshold: number }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  if (!current) return null;

  return (
    <div>
      <div role="tablist" aria-label="Product groups" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === current.key}
            onClick={() => setActive(tab.key)}
            className={`chip shrink-0 border-2 px-4 py-2.5 text-sm transition-all ${
              tab.key === current.key
                ? "border-ink bg-ink text-cream"
                : "border-line bg-white text-ink hover:border-ink"
            }`}
          >
            <span aria-hidden="true">{tab.emoji}</span> {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" key={current.key} className="mt-6 grid animate-[pop_0.4s_ease-out] grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {current.products.slice(0, 8).map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 2} lowStockThreshold={lowStockThreshold} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/shop" className="btn btn-ghost">
          See all products <PiArrowRightBold />
        </Link>
      </div>
    </div>
  );
}
