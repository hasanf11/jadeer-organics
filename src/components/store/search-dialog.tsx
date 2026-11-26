"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PiArrowLeftBold, PiArrowRightBold, PiMagnifyingGlassBold, PiXBold } from "react-icons/pi";
import ProductVisual from "@/components/product-visual";
import Drawer from "@/components/store/drawer";
import { useI18n } from "@/components/i18n-provider";
import { useStore } from "@/components/store/store-provider";
import { shortMoney } from "@/lib/format";
import type { ClientProduct } from "@/lib/catalog";

const OPEN_EVENT = "jadeer:open-search";

export function openSearch() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function normalise(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ًͯ-ٟ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/['’]/g, "");
}

type Searchable = Pick<ClientProduct, "name" | "category"> & {
  nameEn?: string;
  badges: string[];
  variants: { label: string }[];
};

/** Search by English or Arabic name, category, label or size. */
export function searchProducts<T extends Searchable>(products: T[], query: string, badgeLabels: Record<string, string> = {}): T[] {
  const terms = normalise(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  return products
    .map((product) => {
      const haystack = normalise(
        [product.name, product.nameEn ?? "", product.category ?? "", ...product.badges.map((b) => badgeLabels[b] ?? b), ...product.variants.map((v) => v.label)].join(" "),
      );
      const name = normalise(`${product.name} ${product.nameEn ?? ""}`);
      let score = 0;
      for (const term of terms) {
        if (!haystack.includes(term)) return null;
        score += name.startsWith(term) ? 6 : name.includes(term) ? 4 : 1;
      }
      return { product, score };
    })
    .filter((entry): entry is { product: T; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product);
}

export default function SearchDialog() {
  const router = useRouter();
  const { t, href, rtl } = useI18n();
  const { products } = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const Arrow = rtl ? PiArrowLeftBold : PiArrowRightBold;

  useEffect(() => {
    const show = () => setOpen(true);
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (!typing && (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"))) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener(OPEN_EVENT, show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const results = useMemo(() => searchProducts(products, query, t.badges).slice(0, 8), [products, query, t.badges]);

  function close() {
    setOpen(false);
    window.setTimeout(() => setQuery(""), 300);
  }

  function seeAll() {
    if (!query.trim()) return;
    close();
    router.push(`${href("/shop")}?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <Drawer open={open} onClose={close} label={t.common.search} side="top" className="mx-auto max-w-2xl md:mt-6 md:rounded-3xl">
      <form
        role="search"
        className="flex items-center gap-2 border-b border-line p-3 md:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          seeAll();
        }}
      >
        <PiMagnifyingGlassBold size={20} className="ms-2 shrink-0 text-tomato" aria-hidden="true" />
        <input
          data-autofocus
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.common.searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent px-2 py-3 font-display text-xl outline-none placeholder:text-ink-soft/50"
          enterKeyHint="search"
          autoComplete="off"
          maxLength={80}
          aria-label={t.common.search}
        />
        <button type="button" onClick={close} className="icon-btn shrink-0" aria-label={t.common.close}>
          <PiXBold size={22} />
        </button>
      </form>

      <div className="overflow-y-auto overscroll-contain p-3 md:p-4" data-lenis-prevent>
        {!query.trim() && (
          <div className="pb-2">
            <p className="eyebrow mb-3">{t.search.popular}</p>
            <div className="flex flex-wrap gap-2">
              {t.search.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setQuery(suggestion)}
                  className="chip bg-paper px-4 py-2 text-[0.85rem] shadow-[inset_0_0_0_1px_var(--color-line)] transition-shadow hover:shadow-[inset_0_0_0_1.5px_var(--color-ink)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="py-10 text-center">
            <PiMagnifyingGlassBold size={28} className="mx-auto text-ink-soft" aria-hidden="true" />
            <p className="mt-3 font-bold">{t.search.nothing(query)}</p>
            <p className="text-ink-soft">{t.search.tryAnother}</p>
          </div>
        )}

        <ul className="grid gap-1" aria-live="polite">
          {results.map((product) => (
            <li key={product.id}>
              <Link href={href(`/products/${product.slug}`)} onClick={close} className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-paper">
                <span className="relative block size-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                  <ProductVisual image={product.image} alt={product.name} art={product.art} sizes="64px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{product.name}</span>
                  <span className="block truncate text-sm text-ink-soft">{product.category}</span>
                </span>
                <span className="font-bold">{shortMoney(Math.min(...product.variants.map((v) => v.price)))}</span>
              </Link>
            </li>
          ))}
        </ul>

        {results.length > 0 && (
          <button type="button" onClick={seeAll} className="btn btn-soft mt-3 w-full">
            {t.search.seeAllResults} <Arrow />
          </button>
        )}
      </div>
    </Drawer>
  );
}
