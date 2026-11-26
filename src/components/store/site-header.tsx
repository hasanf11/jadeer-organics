"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  PiArrowRightBold,
  PiArrowLeftBold,
  PiCaretDownBold,
  PiHeartBold,
  PiHouseBold,
  PiPlantBold,
  PiListBold,
  PiMagnifyingGlassBold,
  PiShoppingBagOpenBold,
  PiXBold,
  PiStorefrontBold,
  PiBookOpenTextBold,
  PiTagBold,
  PiChatCircleTextBold,
  PiPackageBold,
  PiQuestionBold,
  PiLeafBold,
  PiReceiptBold,
  PiHandshakeBold,
} from "react-icons/pi";
import Logo from "@/components/logo";
import { useI18n } from "@/components/i18n-provider";
import LanguageSwitch from "@/components/store/language-switch";
import { openSearch } from "@/components/store/search-dialog";
import CategoryIcon from "@/components/store/category-icon";
import { imageUrl } from "@/lib/images";
import { openBag, useCart, useWishlist } from "@/lib/cart";
import { stripLocale } from "@/lib/i18n/config";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

type NavCategory = { slug: string; name: string; image: string | null; productCount: number; color: string };

export default function SiteHeader({ categories }: { categories: NavCategory[] }) {
  return (
    <Suspense fallback={<HeaderView categories={categories} pathname="/" />}>
      <HeaderWithPath categories={categories} />
    </Suspense>
  );
}

function HeaderWithPath({ categories }: { categories: NavCategory[] }) {
  return <HeaderView categories={categories} pathname={stripLocale(usePathname())} />;
}

function HeaderView({ categories, pathname }: { categories: NavCategory[]; pathname: string }) {
  const { t, href, rtl, locale } = useI18n();
  const { count } = useCart();
  const { ids } = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const previousCount = useRef(count);
  const Arrow = rtl ? PiArrowLeftBold : PiArrowRightBold;

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

  // Close the menu when the page changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    lockScroll();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      unlockScroll();
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`));
  const navLink = (active: boolean) =>
    `relative py-2 text-[0.93rem] font-semibold transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[2px] after:rounded-full after:bg-tomato after:transition-transform after:duration-300 ${
      active ? "text-ink after:scale-x-100" : "text-ink-soft hover:text-ink after:scale-x-0 hover:after:scale-x-100"
    }`;

  const menuLinks = [
    { path: "/", label: t.common.home, icon: PiHouseBold },
    { path: "/shop", label: t.common.shopAll, icon: PiLeafBold },
    { path: "/offers", label: t.nav.offers, icon: PiTagBold },
    { path: "/stores", label: t.nav.stores, icon: PiStorefrontBold },
    { path: "/journal", label: t.nav.journal, icon: PiBookOpenTextBold },
    { path: "/about", label: t.nav.story, icon: PiPlantBold },
    { path: "/orders", label: t.nav.myOrders, icon: PiReceiptBold },
    { path: "/track", label: t.nav.track, icon: PiPackageBold },
    { path: "/wishlist", label: t.common.wishlist, icon: PiHeartBold },
    { path: "/wholesale", label: t.nav.wholesale, icon: PiHandshakeBold },
    { path: "/faq", label: t.nav.faq, icon: PiQuestionBold },
    { path: "/contact", label: t.nav.contact, icon: PiChatCircleTextBold },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
          scrolled ? "border-line bg-cream shadow-[0_8px_24px_-18px_rgb(26_31_27/0.35)]" : "border-transparent bg-cream"
        }`}
      >
        <div className="container-x flex h-16 items-center gap-2 md:h-[4.75rem] md:gap-3">
          <button
            type="button"
            className="icon-btn -ms-2 lg:hidden"
            aria-label={menuOpen ? t.common.close : t.common.menu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <PiXBold size={24} /> : <PiListBold size={24} />}
          </button>

          <Link href={href("/")} aria-label={t.meta.siteName} className="shrink-0 max-lg:absolute max-lg:start-1/2 max-lg:-translate-x-1/2 rtl:max-lg:translate-x-1/2">
            <Logo locale={locale} />
          </Link>

          <nav aria-label="Main" className="ms-8 hidden items-center gap-7 lg:flex">
            <Link href={href("/")} className={navLink(isActive("/"))}>
              {t.common.home}
            </Link>
            <div className="group relative">
              <Link href={href("/shop")} className={`flex items-center gap-1 ${navLink(isActive("/shop") || isActive("/category") || isActive("/products"))}`}>
                {t.common.shop} <PiCaretDownBold size={12} className="transition-transform duration-300 group-hover:rotate-180" />
              </Link>
              <div className="invisible absolute -start-6 top-full w-[680px] translate-y-1 pt-4 opacity-0 transition-all duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="card grid grid-cols-[1fr_1fr_210px] gap-1 p-3 shadow-pop">
                  <div className="col-span-2 grid grid-cols-2 gap-1">
                    {categories.map((category) => (
                      <Link key={category.slug} href={href(`/category/${category.slug}`)} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-cream">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: category.color }}>
                          <CategoryIcon slug={category.slug} size={22} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[0.92rem] font-bold leading-tight">{category.name}</span>
                          <span className="text-xs text-ink-soft">{t.shop.categoryProducts(category.productCount)}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                  <Link href={href("/shop")} className="group/all relative flex flex-col justify-end overflow-hidden rounded-xl bg-leaf p-4 text-white">
                    <span className="font-display text-xl leading-tight">{t.nav.fullPantry}</span>
                    <span className="mt-1 flex items-center gap-1 text-sm text-white/80">
                      {t.common.shopAll} <Arrow className="transition-transform group-hover/all:translate-x-1 rtl:group-hover/all:-translate-x-1" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
            <Link href={href("/offers")} className={navLink(isActive("/offers"))}>{t.nav.offers}</Link>
            <Link href={href("/stores")} className={navLink(isActive("/stores"))}>{t.nav.stores}</Link>
            <Link href={href("/journal")} className={navLink(isActive("/journal"))}>{t.nav.journal}</Link>
            <Link href={href("/about")} className={navLink(isActive("/about"))}>{t.nav.story}</Link>
          </nav>

          <div className="ms-auto flex items-center gap-1">
            <LanguageSwitch className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink hover:bg-sand md:flex" />
            <button
              type="button"
              onClick={openSearch}
              className="icon-btn xl:flex xl:h-10 xl:w-52 xl:justify-start xl:gap-2.5 xl:rounded-full xl:bg-paper xl:px-4 xl:text-ink-soft xl:shadow-[inset_0_0_0_1px_var(--color-line)] xl:hover:shadow-[inset_0_0_0_1.5px_var(--color-ink)]"
              aria-label={t.common.search}
            >
              <PiMagnifyingGlassBold size={20} />
              <span className="hidden text-sm xl:inline">{t.common.searchShort}</span>
            </button>
            <Link href={href("/wishlist")} className="icon-btn relative hidden lg:inline-grid" aria-label={t.common.wishlist}>
              <PiHeartBold size={21} />
              {ids.length > 0 && <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-tomato" />}
            </Link>
            <button
              type="button"
              onClick={openBag}
              className={`relative ms-1 hidden h-10 items-center gap-2 rounded-full bg-leaf ps-3.5 pe-4 text-sm font-bold text-white transition-transform lg:flex ${bump ? "scale-110" : ""}`}
              aria-label={`${t.common.bag} (${count})`}
              data-bag-target
            >
              <PiShoppingBagOpenBold size={18} />
              <span className="tabular-nums">{count}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen phone menu (outside the header so it always covers the screen). */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label={t.common.menu}
        className={`fixed inset-x-0 bottom-0 top-0 z-[45] flex flex-col bg-cream transition-[opacity,visibility] duration-300 lg:hidden ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <Logo locale={locale} />
          <button type="button" className="icon-btn" onClick={() => setMenuOpen(false)} aria-label={t.common.close}>
            <PiXBold size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-32 pt-4" data-lenis-prevent>
          <nav aria-label={t.common.menu} className="grid">
            {menuLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                href={href(path)}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(path) ? "page" : undefined}
                className={`flex items-center gap-3.5 border-b border-line py-3.5 text-lg font-bold ${isActive(path) ? "text-tomato" : "text-ink"}`}
              >
                <span className="grid size-9 place-items-center rounded-full bg-sand text-leaf">
                  <Icon size={19} />
                </span>
                <span className="flex-1">{label}</span>
                <Arrow size={16} className="text-ink-soft" />
              </Link>
            ))}
          </nav>
          <p className="eyebrow mb-3 mt-7">{t.nav.categories}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((category) => {
              const src = imageUrl(category.image);
              return (
                <Link
                  key={category.slug}
                  href={href(`/category/${category.slug}`)}
                  onClick={() => setMenuOpen(false)}
                  className="relative flex aspect-[16/10] items-end overflow-hidden rounded-2xl p-3"
                  style={{ background: category.color }}
                >
                  {src && <Image src={src} alt="" fill sizes="50vw" className="object-cover opacity-80" />}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="relative text-[0.95rem] font-bold leading-tight text-white">{category.name}</span>
                </Link>
              );
            })}
          </div>
          <LanguageSwitch className="btn btn-soft mt-6 w-full" />
        </div>
      </div>
    </>
  );
}
