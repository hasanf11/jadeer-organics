"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { PiFunnelBold, PiMagnifyingGlassBold, PiXBold } from "react-icons/pi";
import ProductCard, { type CardProduct } from "@/components/store/product-card";
import Drawer from "@/components/store/drawer";
import { searchProducts } from "@/components/store/search-dialog";
import { useI18n } from "@/components/i18n-provider";
import { BADGES, type BadgeKey } from "@/lib/badges";

type ShopCategory = { slug: string; name: string; productCount: number; color?: string };
type ShopProduct = CardProduct & { categorySlug: string | null; featured: boolean; createdAt: string; sortOrder: number };

const SORT_KEYS = ["featured", "price-asc", "price-desc", "newest", "name"] as const;
const FILTER_BADGES: BadgeKey[] = ["organic", "keto", "vegan", "sugar-free", "gluten-free", "preservative-free", "local", "cold-pressed"];
const minPrice = (p: ShopProduct) => Math.min(...p.variants.map((v) => v.price));

export default function ShopBrowser({
  products,
  categories,
  lowStockThreshold,
  lockedCategory,
}: {
  products: ShopProduct[];
  categories: ShopCategory[];
  lowStockThreshold: number;
  lockedCategory?: string;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = lockedCategory ?? params.get("category") ?? "";
  const tags = params.get("tags") ?? "";
  const badges = useMemo(() => tags.split(",").filter((b): b is BadgeKey => b in BADGES), [tags]);
  const sort = params.get("sort") ?? "featured";
  const inStockOnly = params.get("stock") === "1";
  const [query, setQuery] = useState(params.get("q") ?? "");

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function toggleBadge(badge: BadgeKey) {
    const set = new Set(badges);
    if (set.has(badge)) set.delete(badge);
    else set.add(badge);
    update({ tags: Array.from(set).join(",") || null });
  }

  const results = useMemo(() => {
    let list = query.trim() ? searchProducts(products, query, t.badges) : [...products];
    if (category) list = list.filter((p) => p.categorySlug === category);
    if (badges.length) list = list.filter((p) => badges.every((b) => p.badges.includes(b)));
    if (inStockOnly) list = list.filter((p) => p.variants.some((v) => v.stock > 0));
    if (!query.trim() || sort !== "featured") {
      list.sort((a, b) => {
        switch (sort) {
          case "price-asc":
            return minPrice(a) - minPrice(b);
          case "price-desc":
            return minPrice(b) - minPrice(a);
          case "newest":
            return b.createdAt.localeCompare(a.createdAt);
          case "name":
            return a.name.localeCompare(b.name, locale);
          default:
            return Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder;
        }
      });
    }
    return list;
  }, [products, query, category, badges, inStockOnly, sort, t.badges, locale]);

  const activeCount = (lockedCategory ? 0 : category ? 1 : 0) + badges.length + (inStockOnly ? 1 : 0);

  const filters = (
    <div className="grid gap-7">
      {!lockedCategory && categories.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3 text-ink-soft">{t.shop.category}</legend>
          <div className="grid">
            {[{ slug: "", name: t.shop.allProducts, productCount: products.length }, ...categories].map((c) => {
              const on = category === c.slug;
              return (
                <button
                  key={c.slug || "all"}
                  type="button"
                  onClick={() => update({ category: c.slug && !on ? c.slug : null })}
                  aria-pressed={on}
                  className={`flex min-h-11 items-center justify-between border-b border-line py-2.5 text-start text-[0.95rem] transition-colors ${on ? "font-bold text-leaf" : "text-ink-soft hover:text-ink"}`}
                >
                  <span className="flex items-center gap-2">{on && <span className="size-2 rounded-full bg-tomato" />}{c.name}</span>
                  <span className="text-xs">{c.productCount}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="eyebrow mb-3 text-ink-soft">{t.shop.dietary}</legend>
        <div className="flex flex-wrap gap-2">
          {FILTER_BADGES.map((badge) => {
            const on = badges.includes(badge);
            return (
              <button
                key={badge}
                type="button"
                onClick={() => toggleBadge(badge)}
                aria-pressed={on}
                className="chip min-h-10 px-3.5 py-2 text-[0.82rem] transition-colors"
                style={on ? { background: BADGES[badge].color, color: "#fff" } : { background: BADGES[badge].bg, color: BADGES[badge].color }}
              >
                {t.badges[badge]}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 border-y border-line py-3 text-[0.95rem] font-bold">
        {t.shop.inStockOnly}
        <input type="checkbox" checked={inStockOnly} onChange={(e) => update({ stock: e.target.checked ? "1" : null })} className="peer sr-only" />
        <span className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors after:absolute after:start-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-leaf peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-tomato" />
      </label>
      {activeCount > 0 && (
        <button type="button" onClick={() => update({ category: null, tags: null, stock: null })} className="btn btn-soft">
          {t.shop.clear}
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-28">{filters}</div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <form
            role="search"
            className="relative min-w-0 flex-1 basis-full sm:basis-auto"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: query.trim() || null });
            }}
          >
            <PiMagnifyingGlassBold className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-soft" size={19} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) update({ q: null });
              }}
              onBlur={() => update({ q: query.trim() || null })}
              placeholder={t.common.searchPlaceholder}
              aria-label={t.common.search}
              className="input rounded-full ps-11"
              maxLength={80}
              enterKeyHint="search"
            />
          </form>
          <button type="button" onClick={() => setFiltersOpen(true)} className="btn btn-soft flex-1 sm:flex-none lg:hidden">
            <PiFunnelBold aria-hidden="true" /> {t.shop.filters}
            {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-tomato text-[0.65rem] text-white">{activeCount}</span>}
          </button>
          <label className="sr-only" htmlFor="sort">{t.shop.sort}</label>
          <select id="sort" value={sort} onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })} className="input min-h-12 w-auto flex-1 rounded-full sm:flex-none">
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>{t.shop.sorts[key]}</option>
            ))}
          </select>
        </div>

        <p className="mt-4 text-sm font-bold text-ink-soft" aria-live="polite">
          {t.shop.count(results.length)} {query.trim() && t.shop.forQuery(query.trim())}
        </p>

        {results.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-paper p-10 text-center shadow-soft">
            <PiMagnifyingGlassBold size={32} className="mx-auto text-tomato" aria-hidden="true" />
            <h2 className="mt-4 text-2xl">{t.shop.noResults}</h2>
            <p className="mt-1 text-ink-soft">{t.shop.noResultsText}</p>
            <button
              type="button"
              className="btn btn-primary mt-5"
              onClick={() => {
                setQuery("");
                update({ q: null, tags: null, stock: null, category: null });
              }}
            >
              {t.shop.showEverything}
            </button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3">
            {results.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} lowStockThreshold={lowStockThreshold} />
            ))}
          </div>
        )}
      </div>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} label={t.shop.filters} side="bottom">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-2xl">{t.shop.filters}</h2>
          <button type="button" className="icon-btn" onClick={() => setFiltersOpen(false)} aria-label={t.common.close}>
            <PiXBold size={22} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-5" data-lenis-prevent>{filters}</div>
        <div className="safe-bottom border-t border-line px-5 pb-4 pt-3">
          <button type="button" className="btn btn-primary w-full" onClick={() => setFiltersOpen(false)}>
            {t.shop.showResults(results.length)}
          </button>
        </div>
      </Drawer>
    </div>
  );
}
