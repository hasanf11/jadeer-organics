"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  PiCaretDownBold,
  PiHeartBold,
  PiListBold,
  PiMagnifyingGlassBold,
  PiShoppingBagOpenBold,
  PiXBold,
} from "react-icons/pi";
import Logo from "@/components/logo";
import { openBag, useCart, useWishlist } from "@/lib/cart";
import { openSearch } from "@/components/store/search-dialog";

type NavCategory = { slug: string; name: string; nameAr: string; emoji: string; color: string };

const links = [
  { href: "/shop", label: "Shop all" },
  { href: "/stores", label: "Our stores" },
  { href: "/about", label: "Our story" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader({ categories }: { categories: NavCategory[] }) {
  return (
    <Suspense fallback={<HeaderView categories={categories} pathname="" />}>
      <HeaderWithPath categories={categories} />
    </Suspense>
  );
}

function HeaderWithPath({ categories }: { categories: NavCategory[] }) {
  return <HeaderView categories={categories} pathname={usePathname()} />;
}

function HeaderView({ categories, pathname }: { categories: NavCategory[]; pathname: string }) {
  const { count } = useCart();
  const { ids } = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const previousCount = useRef(count);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (count > previousCount.current) {
      setBump(true);
      const id = window.setTimeout(() => setBump(false), 500);
      previousCount.current = count;
      return () => window.clearTimeout(id);
    }
    previousCount.current = count;
  }, [count]);

  // Close the menu when navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-300 ${
        scrolled || menuOpen
          ? "bg-cream/90 shadow-[0_8px_30px_-18px_rgb(42_28_23/0.45)] backdrop-blur-xl"
          : "bg-cream"
      }`}
    >
      <div className="container-x flex h-[4.25rem] items-center gap-3 md:h-20">
        <button
          type="button"
          className="icon-btn -ml-2 lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <PiXBold size={24} /> : <PiListBold size={24} />}
        </button>

        <Link href="/" aria-label="Ja'deer Organics — home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
          <div className="group relative">
            <Link
              href="/shop"
              className={`flex items-center gap-1 rounded-full px-4 py-2 font-bold transition-colors hover:bg-white ${
                isActive("/shop") || isActive("/category") ? "bg-white text-leaf" : ""
              }`}
            >
              Shop <PiCaretDownBold size={14} className="transition-transform group-hover:rotate-180" />
            </Link>
            <div className="invisible absolute left-0 top-full w-[560px] translate-y-2 pt-3 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="card grid grid-cols-2 gap-2 p-3 shadow-pop">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-cream"
                  >
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-xl text-xl"
                      style={{ background: `${category.color}22` }}
                    >
                      {category.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold leading-tight">{category.name}</span>
                      <span className="arabic block text-sm text-ink-soft" dir="rtl">
                        {category.nameAr}
                      </span>
                    </span>
                  </Link>
                ))}
                <Link
                  href="/shop"
                  className="col-span-2 mt-1 rounded-2xl bg-leaf p-3 text-center font-bold text-white transition-colors hover:bg-leaf-dark"
                >
                  Browse every product →
                </Link>
              </div>
            </div>
          </div>
          {links.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 font-bold transition-colors hover:bg-white ${
                isActive(link.href) ? "bg-white text-leaf" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 md:gap-1">
          <button
            type="button"
            onClick={openSearch}
            className="icon-btn md:flex md:h-11 md:w-auto md:gap-2 md:rounded-full md:border-2 md:border-line md:bg-white md:px-4 md:text-ink-soft md:hover:border-ink"
            aria-label="Search products"
          >
            <PiMagnifyingGlassBold size={21} />
            <span className="hidden text-sm font-semibold md:inline">Search</span>
            <kbd className="hidden rounded-md bg-cream px-1.5 text-[0.7rem] font-bold lg:inline">/</kbd>
          </button>

          <Link href="/wishlist" className="icon-btn relative hidden sm:inline-grid" aria-label={`Wishlist, ${ids.length} saved`}>
            <PiHeartBold size={22} />
            {ids.length > 0 && (
              <span className="absolute right-1 top-1 grid min-w-[1.1rem] place-items-center rounded-full bg-berry px-1 text-[0.65rem] font-bold text-white">
                {ids.length}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={openBag}
            className={`relative ml-1 flex h-11 items-center gap-2 rounded-full bg-ink pl-3.5 pr-4 font-bold text-cream transition-transform hover:scale-105 ${
              bump ? "animate-wiggle" : ""
            }`}
            aria-label={`Open bag, ${count} items`}
            data-bag-target
          >
            <PiShoppingBagOpenBold size={20} />
            <span className="tabular-nums">{count}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`fixed inset-x-0 bottom-0 top-[4.25rem] z-40 overflow-y-auto bg-cream px-4 pb-28 pt-2 transition-[opacity,transform] duration-300 lg:hidden ${
          menuOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0"
        }`}
        data-lenis-prevent
      >
        <p className="eyebrow mb-3 mt-2">Shop by category</p>
        <div className="grid grid-cols-2 gap-2.5">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="flex min-h-[4.5rem] items-center gap-2.5 rounded-2xl p-3 font-bold leading-tight"
              style={{ background: `${category.color}1f` }}
            >
              <span className="text-2xl">{category.emoji}</span>
              <span className="text-[0.95rem]">{category.name}</span>
            </Link>
          ))}
        </div>
        <nav aria-label="Mobile" className="mt-6 grid gap-1 text-2xl font-extrabold">
          {[...links, { href: "/wishlist", label: "Wishlist" }, { href: "/track", label: "Track my order" }, { href: "/faq", label: "FAQ" }].map(
            (link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-2xl px-3 py-3 font-display hover:bg-white"
              >
                {link.label}
                <span aria-hidden="true" className="text-leaf">→</span>
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
