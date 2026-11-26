"use client";

import { useMemo, useSyncExternalStore } from "react";

// The bag and wishlist live in the visitor's browser (there are no
// customer accounts). Prices and stock are always re-checked by the
// server when an order is placed.

export type CartItem = { variantId: string; quantity: number };

const CART_KEY = "jadeer:bag:v1";
const WISHLIST_KEY = "jadeer:wishlist:v1";
const CHANGE_EVENT = "jadeer:storage-changed";
export const OPEN_BAG_EVENT = "jadeer:open-bag";
export const BAG_ADDED_EVENT = "jadeer:bag-added";

const MAX_LINES = 50;
export const MAX_ITEM_QUANTITY = 99;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseCart(raw: string | null): CartItem[] {
  if (!raw || raw.length > 20000) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const items = new Map<string, CartItem>();
    for (const entry of parsed.slice(0, MAX_LINES)) {
      if (typeof entry !== "object" || entry === null) continue;
      const { variantId, quantity } = entry as Record<string, unknown>;
      if (
        typeof variantId !== "string" ||
        !UUID.test(variantId) ||
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        continue;
      }
      const id = variantId.toLowerCase();
      items.set(id, {
        variantId: id,
        quantity: Math.min(MAX_ITEM_QUANTITY, (items.get(id)?.quantity ?? 0) + quantity),
      });
    }
    return Array.from(items.values());
  } catch {
    return [];
  }
}

function parseWishlist(raw: string | null): string[] {
  if (!raw || raw.length > 20000) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(parsed.filter((id): id is string => typeof id === "string" && UUID.test(id))),
    ).slice(0, 100);
  } catch {
    return [];
  }
}

function read(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("Your browser is blocking site storage. Please allow it to use the bag.");
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CART_KEY || event.key === WISHLIST_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, () => read(CART_KEY), () => null);
  const items = useMemo(() => parseCart(snapshot), [snapshot]);
  return {
    items,
    ready: snapshot !== null,
    count: items.reduce((total, item) => total + item.quantity, 0),
  };
}

export function useWishlist() {
  const snapshot = useSyncExternalStore(subscribe, () => read(WISHLIST_KEY), () => null);
  const ids = useMemo(() => parseWishlist(snapshot), [snapshot]);
  return { ids, ready: snapshot !== null };
}

export function toggleWishlist(productId: string): boolean {
  const ids = parseWishlist(read(WISHLIST_KEY));
  const id = productId.toLowerCase();
  const has = ids.includes(id);
  write(WISHLIST_KEY, has ? ids.filter((x) => x !== id) : [id, ...ids]);
  return !has;
}

export function addToCart(variantId: string, quantity: number, stock: number) {
  if (!UUID.test(variantId) || !Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Choose a valid quantity.");
  }
  if (stock < 1) throw new Error("This size is sold out.");

  const id = variantId.toLowerCase();
  const items = parseCart(read(CART_KEY));
  const existing = items.find((item) => item.variantId === id);
  const maximum = Math.min(stock, MAX_ITEM_QUANTITY);
  const next = (existing?.quantity ?? 0) + quantity;

  if (next > maximum) {
    throw new Error(
      existing
        ? `You already have ${existing.quantity} in your bag — only ${maximum} available.`
        : `Only ${maximum} available.`,
    );
  }
  if (!existing && items.length >= MAX_LINES) {
    throw new Error("Your bag is full. Place this order first.");
  }

  write(
    CART_KEY,
    existing
      ? items.map((item) => (item.variantId === id ? { ...item, quantity: next } : item))
      : [...items, { variantId: id, quantity }],
  );
  window.dispatchEvent(new CustomEvent(BAG_ADDED_EVENT, { detail: { variantId: id, quantity } }));
}

export function setCartQuantity(variantId: string, quantity: number) {
  const id = variantId.toLowerCase();
  const items = parseCart(read(CART_KEY));
  if (quantity < 1) {
    write(CART_KEY, items.filter((item) => item.variantId !== id));
    return;
  }
  write(
    CART_KEY,
    items.map((item) =>
      item.variantId === id ? { ...item, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) } : item,
    ),
  );
}

export function removeFromCart(variantId: string) {
  const id = variantId.toLowerCase();
  write(CART_KEY, parseCart(read(CART_KEY)).filter((item) => item.variantId !== id));
}

export function clearCart() {
  write(CART_KEY, []);
}

export function openBag() {
  window.dispatchEvent(new Event(OPEN_BAG_EVENT));
}
