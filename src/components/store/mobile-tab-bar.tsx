"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { PiHeartBold, PiHouseBold, PiMagnifyingGlassBold, PiShoppingBagOpenBold, PiSquaresFourBold } from "react-icons/pi";
import { useI18n } from "@/components/i18n-provider";
import { openSearch } from "@/components/store/search-dialog";
import { openBag, useCart, useWishlist } from "@/lib/cart";
import { stripLocale } from "@/lib/i18n/config";

// The phone navigation: five things people do most, one thumb-tap away.
// The bag lives here on phones (and in the header on computers).

export default function MobileTabBar() {
  return (
    <Suspense fallback={<TabBarView pathname="/" />}>
      <TabBarWithPath />
    </Suspense>
  );
}

function TabBarWithPath() {
  return <TabBarView pathname={stripLocale(usePathname())} />;
}

function TabBarView({ pathname }: { pathname: string }) {
  const { t, href } = useI18n();
  const { count } = useCart();
  const { ids } = useWishlist();

  if (pathname.startsWith("/checkout")) return null;

  const item = "relative flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[0.66rem] font-bold";
  const tone = (on: boolean) => (on ? "text-leaf" : "text-ink-soft");
  const dot = (n: number, color: string) =>
    n > 0 && (
      <span className={`absolute start-1/2 top-1 ms-2.5 grid h-[1.05rem] min-w-[1.05rem] place-items-center rounded-full px-1 text-[0.6rem] leading-none text-white ${color}`}>
        {n > 99 ? "99+" : n}
      </span>
    );

  return (
    <nav aria-label={t.common.menu} className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper lg:hidden">
      <div className="mx-auto flex h-[3.6rem] max-w-lg">
        <Link href={href("/")} className={`${item} ${tone(pathname === "/")}`} aria-current={pathname === "/" ? "page" : undefined}>
          <PiHouseBold size={22} />
          {t.common.home}
        </Link>
        <Link href={href("/shop")} className={`${item} ${tone(["/shop", "/category", "/products"].some((p) => pathname.startsWith(p)))}`}>
          <PiSquaresFourBold size={22} />
          {t.common.shop}
        </Link>
        <button type="button" onClick={openSearch} className={`${item} text-ink-soft`}>
          <PiMagnifyingGlassBold size={22} />
          {t.common.search}
        </button>
        <Link href={href("/wishlist")} className={`${item} ${tone(pathname === "/wishlist")}`}>
          <PiHeartBold size={22} />
          {dot(ids.length, "bg-berry")}
          {t.common.saved}
        </Link>
        <button type="button" onClick={openBag} className={`${item} ${tone(pathname === "/bag")}`} data-bag-target aria-label={`${t.common.bag} (${count})`}>
          <PiShoppingBagOpenBold size={22} />
          {dot(count, "bg-tomato")}
          {t.common.bag}
        </button>
      </div>
    </nav>
  );
}
