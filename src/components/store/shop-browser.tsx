"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { PiFunnelBold, PiMagnifyingGlassBold, PiXBold } from "react-icons/pi";
import ProductCard, { type CardProduct } from "@/components/store/product-card";
import { searchProducts } from "@/components/store/search-dialog";
import { BADGES, type BadgeKey } from "@/lib/badges";

type ShopCategory = { slug: string; name: string; emoji: string; color: string; productCount: number };
type ShopProduct = CardProduct & { categorySlug: string | null; featured: boolean; createdAt: string; sortOrder: number };

const SORTS = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "newest", label: "Newest" },
  { key: "name", label: "A → Z" },
] as const;

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
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const sheetRef = useRef<HTMLDialogElement>(null);

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
    let list = query.trim()
      ? searchProducts(products, query)
      : [...products];

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
            return a.name.localeCompare(b.name);
          default:
            return Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder;
        }
      });
    }
    return list;
  }, [products, query, category, badges, inStockOnly, sort]);

  const activeCount = (lockedCategory ? 0 : category ? 1 : 0) + badges.length + (inStockOnly ? 1 : 0);

  const filters = (
    <div className="grid gap-7">
      {!lockedCategory && (
        <fieldset>
          <legend className="mb-3 font-display text-lg font-extrabold">Category</legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => update({ category: null })}
              className={`chip border-2 px-3.5 py-2 text-sm ${!category ? "border-ink bg-ink text-cream" : "border-line bg-white"}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => update({ category: category === c.slug ? null : c.slug })}
                aria-pressed={category === c.slug}
                className={`chip border-2 px-3.5 py-2 text-sm ${category === c.slug ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-ink"}`}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-3 font-display text-lg font-extrabold">Lifestyle</legend>
        <div className="flex flex-wrap gap-2">
          {FILTER_BADGES.map((badge) => {
            const on = badges.includes(badge);
            return (
              <button
                key={badge}
                type="button"
                onClick={() => toggleBadge(badge)}
                aria-pressed={on}
                className="chip border-2 px-3.5 py-2 text-sm transition-colors"
                style={
                  on
                    ? { background: BADGES[badge].color, borderColor: BADGES[badge].color, color: "#fff" }
                    : { background: BADGES[badge].bg, borderColor: "transparent", color: BADGES[badge].color }
                }
              >
                {BADGES[badge].emoji} {BADGES[badge].label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white p-4 font-bold">
        In stock only
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => update({ stock: e.target.checked ? "1" : null })}
          className="peer sr-only"
        />
        <span className="relative h-7 w-12 rounded-full bg-line transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-leaf peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-sun" />
      </label>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => update({ category: null, tags: null, stock: null })}
          className="btn btn-soft"
        >
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[270px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-28">{filters}</div>
      </aside>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <form
            role="search"
            className="relative min-w-0 flex-1 basis-full sm:basis-auto"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: query.trim() || null });
            }}
          >
            <PiMagnifyingGlassBold className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" size={20} />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) update({ q: null });
              }}
              onBlur={() => update({ q: query.trim() || null })}
              placeholder="Search products…"
              aria-label="Search products"
              className="input rounded-full pl-11"
              maxLength={80}
            />
          </form>
          <button type="button" onClick={() => sheetRef.current?.showModal()} className="btn btn-soft lg:hidden">
            <PiFunnelBold /> Filters
            {activeCount > 0 && <span className="chip bg-leaf px-2 py-0.5 text-white">{activeCount}</span>}
          </button>
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}
            className="input w-auto flex-1 rounded-full sm:flex-none"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-4 text-sm font-semibold text-ink-soft" aria-live="polite">
          {results.length} {results.length === 1 ? "product" : "products"}
          {query.trim() && <> for “{query.trim()}”</>}
        </p>

        {results.length === 0 ? (
          <div className="mt-6 rounded-[2rem] bg-white p-10 text-center">
            <p className="text-6xl">🥬</p>
            <h2 className="mt-4 text-2xl">No products match</h2>
            <p className="mt-1 text-ink-soft">Try removing a filter or searching for something else.</p>
            <button
              type="button"
              className="btn btn-primary mt-5"
              onClick={() => {
                setQuery("");
                update({ q: null, tags: null, stock: null, category: null });
              }}
            >
              Show everything
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

      <dialog
        ref={sheetRef}
        aria-label="Filters"
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-[2rem] bg-cream p-0 open:animate-[slide-up_0.3s_ease-out]"
        onClick={(e) => {
          if (e.target === sheetRef.current) sheetRef.current?.close();
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-2xl">Filters</h2>
          <button type="button" className="icon-btn" onClick={() => sheetRef.current?.close()} aria-label="Close filters">
            <PiXBold size={22} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5" data-lenis-prevent>
          {filters}
        </div>
        <div className="safe-bottom border-t border-line px-5 pb-4 pt-3">
          <button type="button" className="btn btn-primary w-full" onClick={() => sheetRef.current?.close()}>
            Show {results.length} products
          </button>
        </div>
      </dialog>
    </div>
  );
}
