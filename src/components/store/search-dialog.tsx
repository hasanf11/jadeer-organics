"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PiArrowRightBold, PiMagnifyingGlassBold, PiXBold } from "react-icons/pi";
import ProductVisual from "@/components/product-visual";
import { useStore } from "@/components/store/store-provider";
import { BADGES } from "@/lib/badges";
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
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "");
}

type Searchable = Pick<ClientProduct, "name" | "nameAr" | "category" | "badges"> & {
  variants: { label: string }[];
};

export function searchProducts<T extends Searchable>(products: T[], query: string): T[] {
  const terms = normalise(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  return products
    .map((product) => {
      const haystack = normalise(
        [
          product.name,
          product.nameAr,
          product.category ?? "",
          ...product.badges.map((b) => BADGES[b].label),
          ...product.variants.map((v) => v.label),
        ].join(" "),
      );
      const name = normalise(product.name);
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

const SUGGESTIONS = ["Olive oil", "Ketchup", "Keto", "Jallab", "Matcha", "Molasses", "Vegan", "Deodorant"];

export default function SearchDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { products } = useStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const open = () => {
      const dialog = dialogRef.current;
      if (!dialog || dialog.open) return;
      dialog.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (!typing && (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"))) {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener(OPEN_EVENT, open);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, open);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const results = useMemo(() => searchProducts(products, query).slice(0, 8), [products, query]);

  function close() {
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Search products"
      className="m-0 mx-auto mt-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-ink/50 sm:mt-[8vh] sm:h-auto sm:max-w-2xl"
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      onClose={() => setQuery("")}
    >
      <div className="flex h-full flex-col bg-cream sm:h-auto sm:max-h-[80vh] sm:rounded-2xl sm:shadow-pop" data-lenis-prevent>
        <form
          role="search"
          className="flex items-center gap-2 border-b border-line p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!query.trim()) return;
            close();
            router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
          }}
        >
          <PiMagnifyingGlassBold size={20} className="ml-2 shrink-0 text-ink-soft" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search olive oil, ketchup, matcha…"
            className="min-w-0 flex-1 bg-transparent px-2 py-3 font-display text-xl outline-none placeholder:text-ink-soft/50"
            enterKeyHint="search"
            autoComplete="off"
            maxLength={80}
            aria-label="Search"
          />
          <button type="button" onClick={close} className="icon-btn shrink-0" aria-label="Close search">
            <PiXBold size={22} />
          </button>
        </form>

        <div className="overflow-y-auto p-3 sm:p-4">
          {!query.trim() && (
            <div>
              <p className="eyebrow mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="chip bg-paper px-4 py-2 text-[0.82rem] shadow-[inset_0_0_0_1px_var(--color-line)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--color-ink)]"
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
              <p className="mt-3 font-semibold">Nothing found for “{query}”.</p>
              <p className="text-ink-soft">Try another word, or browse the shop.</p>
            </div>
          )}

          <ul className="grid gap-1.5" aria-live="polite">
            {results.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.slug}`}
                  onClick={close}
                  className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-white"
                >
                  <span className="relative block size-16 shrink-0 overflow-hidden rounded-xl">
                    <ProductVisual image={product.image} alt={product.name} art={product.art} sizes="64px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{product.name}</span>
                    <span className="block truncate text-sm text-ink-soft">{product.category}</span>
                  </span>
                  <span className="font-semibold">
                    {shortMoney(Math.min(...product.variants.map((v) => v.price)))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {results.length > 0 && (
            <button
              type="button"
              onClick={() => {
                close();
                router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
              }}
              className="btn btn-soft mt-3 w-full"
            >
              See all results <PiArrowRightBold />
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
