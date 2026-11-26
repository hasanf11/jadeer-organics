"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { PiCaretDownBold, PiHeartBold, PiListBold, PiMagnifyingGlassBold, PiShoppingBagOpenBold, PiXBold, PiArrowRightBold } from "react-icons/pi";
import Logo from "@/components/logo";
import { imageUrl } from "@/lib/images";
import { openBag, useCart, useWishlist } from "@/lib/cart";
import { openSearch } from "@/components/store/search-dialog";

type NavCategory = { slug: string; name: string; nameAr: string; image: string | null; productCount: number };

const links = [
  { href: "/shop", label: "Shop" },
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
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (count > previousCount.current) {
      setBump(true);
      const id = window.setTimeout(() => setBump(false), 450);
      previousCount.current = count;
      return () => window.clearTimeout(id);
    }
    previousCount.current = count;
  }, [count]);

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
  const linkClass = (active: boolean) =>
    `relative py-2 text-[0.92rem] font-semibold transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-ink after:transition-transform after:duration-300 ${
      active ? "text-ink after:scale-x-100" : "text-ink-soft hover:text-ink after:scale-x-0 hover:after:scale-x-100"
    }`;

  return (
    <header className={`sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300 ${scrolled || menuOpen ? "border-line bg-cream/92 backdrop-blur-xl" : "border-transparent bg-cream"}`}>
      <div className="container-x flex h-[4.25rem] items-center gap-3 md:h-[4.75rem]">
        <button
          type="button"
          className="icon-btn -ml-2 lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <PiXBold size={22} /> : <PiListBold size={22} />}
        </button>

        <Link href="/" aria-label="Ja'deer Organics — home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="ml-10 hidden items-center gap-8 lg:flex">
          <div className="group relative">
            <Link href="/shop" className={`flex items-center gap-1 ${linkClass(isActive("/shop") || isActive("/category") || isActive("/products"))}`}>
              Shop <PiCaretDownBold size={12} className="transition-transform duration-300 group-hover:rotate-180" />
            </Link>
            <div className="invisible absolute -left-6 top-full w-[640px] translate-y-1 pt-4 opacity-0 transition-all duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="card grid grid-cols-[1fr_1fr_200px] gap-1 p-3 shadow-pop">
                <div className="col-span-2 grid grid-cols-2 gap-1">
                  {categories.map((category) => {
                    const src = imageUrl(category.image);
                    return (
                      <Link key={category.slug} href={`/category/${category.slug}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-cream">
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-sand">
                          {src && <Image src={src} alt="" fill sizes="44px" className="object-cover" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[0.9rem] font-semibold leading-tight">{category.name}</span>
                          <span className="text-xs text-ink-soft">{category.productCount} products</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
                <Link href="/shop" className="group/all relative flex flex-col justify-end overflow-hidden rounded-xl bg-leaf p-4 text-white">
                  <span className="font-display text-xl leading-tight">The full pantry</span>
                  <span className="mt-1 flex items-center gap-1 text-sm text-white/80">
                    Shop all <PiArrowRightBold className="transition-transform group-hover/all:translate-x-1" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
          {links.slice(1).map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(isActive(link.href))}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={openSearch}
            className="icon-btn md:flex md:h-10 md:w-56 md:justify-start md:gap-2.5 md:rounded-full md:bg-paper md:px-4 md:text-ink-soft md:shadow-[inset_0_0_0_1px_var(--color-line)] md:hover:shadow-[inset_0_0_0_1px_var(--color-ink)]"
            aria-label="Search products"
          >
            <PiMagnifyingGlassBold size={18} />
            <span className="hidden text-sm md:inline">Search the pantry</span>
            <kbd className="ml-auto hidden rounded border border-line px-1.5 text-[0.65rem] font-semibold lg:inline">/</kbd>
          </button>

          <Link href="/wishlist" className="icon-btn relative hidden sm:inline-grid" aria-label={`Wishlist, ${ids.length} saved`}>
            <PiHeartBold size={20} />
            {ids.length > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-tomato" />}
          </Link>

          <button
            type="button"
            onClick={openBag}
            className={`relative ml-1 flex h-10 items-center gap-2 rounded-full bg-ink pl-3.5 pr-4 text-sm font-semibold text-cream transition-transform ${bump ? "scale-110" : ""}`}
            aria-label={`Open bag, ${count} items`}
            data-bag-target
          >
            <PiShoppingBagOpenBold size={18} />
            <span className="tabular-nums">{count}</span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`fixed inset-x-0 bottom-0 top-[4.25rem] z-40 overflow-y-auto bg-cream px-5 pb-28 pt-4 transition-[opacity,transform] duration-300 lg:hidden ${
          menuOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
        data-lenis-prevent
      >
        <nav aria-label="Mobile" className="grid border-t border-line">
          {[...links, { href: "/wishlist", label: "Wishlist" }, { href: "/track", label: "Track my order" }, { href: "/faq", label: "Help & FAQ" }].map((link) => (
            <Link key={link.href} href={link.href} className="flex items-center justify-between border-b border-line py-4 font-display text-2xl">
              {link.label}
              <PiArrowRightBold size={18} className="text-ink-soft" />
            </Link>
          ))}
        </nav>
        <p className="eyebrow mb-3 mt-8">Shop by category</p>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => {
            const src = imageUrl(category.image);
            return (
              <Link key={category.slug} href={`/category/${category.slug}`} className="relative flex aspect-[4/3] items-end overflow-hidden rounded-xl bg-sand p-3">
                {src && <Image src={src} alt="" fill sizes="50vw" className="object-cover" />}
                <span className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <span className="relative text-sm font-semibold leading-tight text-white">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
