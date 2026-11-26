"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  PiHeartBold,
  PiHouseBold,
  PiMagnifyingGlassBold,
  PiShoppingBagOpenBold,
  PiSquaresFourBold,
} from "react-icons/pi";
import { openBag, useCart, useWishlist } from "@/lib/cart";
import { openSearch } from "@/components/store/search-dialog";

// A simple app-like tab bar for phones: the five things people do most,
// always one thumb-tap away.

export default function MobileTabBar() {
  return (
    <Suspense fallback={<TabBarView pathname="" />}>
      <TabBarWithPath />
    </Suspense>
  );
}

function TabBarWithPath() {
  return <TabBarView pathname={usePathname()} />;
}

function TabBarView({ pathname }: { pathname: string }) {
  const { count } = useCart();
  const { ids } = useWishlist();

  if (pathname.startsWith("/checkout")) return null;

  const item = "relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 text-[0.7rem] font-bold";
  const active = (match: boolean) => (match ? "text-leaf" : "text-ink-soft");

  return (
    <nav
      aria-label="Quick navigation"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-lg">
        <Link href="/" className={`${item} ${active(pathname === "/")}`}>
          <PiHouseBold size={23} />
          Home
        </Link>
        <Link
          href="/shop"
          className={`${item} ${active(pathname.startsWith("/shop") || pathname.startsWith("/category") || pathname.startsWith("/products"))}`}
        >
          <PiSquaresFourBold size={23} />
          Shop
        </Link>
        <button type="button" onClick={openSearch} className={`${item} text-ink-soft`}>
          <span className="-mt-6 grid size-14 place-items-center rounded-full bg-leaf text-white shadow-[0_6px_0_0_var(--color-leaf-dark)] ring-4 ring-paper">
            <PiMagnifyingGlassBold size={24} />
          </span>
          Search
        </button>
        <Link href="/wishlist" className={`${item} ${active(pathname === "/wishlist")}`}>
          <PiHeartBold size={23} />
          {ids.length > 0 && (
            <span className="absolute left-1/2 top-1 ml-2 grid min-w-[1.1rem] place-items-center rounded-full bg-berry px-1 text-[0.62rem] text-white">
              {ids.length}
            </span>
          )}
          Saved
        </Link>
        <button type="button" onClick={openBag} className={`${item} ${active(pathname === "/bag")}`} data-bag-target>
          <PiShoppingBagOpenBold size={23} />
          {count > 0 && (
            <span className="absolute left-1/2 top-1 ml-2 grid min-w-[1.1rem] place-items-center rounded-full bg-tomato px-1 text-[0.62rem] text-white">
              {count}
            </span>
          )}
          Bag
        </button>
      </div>
    </nav>
  );
}
