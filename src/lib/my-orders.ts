"use client";

import { useSyncExternalStore } from "react";

// Orders placed from this device, so customers can find them again
// without an account. Only the private order link is stored here.

export type SavedOrder = { number: number; token: string; total: number; date: string };

const KEY = "jadeer:my-orders:v1";
const EVENT = "jadeer:my-orders-changed";
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

function parse(raw: string | null): SavedOrder[] {
  try {
    const list: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(list)) return [];
    return list
      .filter((o): o is SavedOrder => typeof o?.number === "number" && typeof o?.token === "string" && TOKEN.test(o.token))
      .slice(0, 30);
  } catch {
    return [];
  }
}

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function saveOrder(order: SavedOrder) {
  try {
    const list = parse(read()).filter((o) => o.token !== order.token);
    localStorage.setItem(KEY, JSON.stringify([order, ...list].slice(0, 30)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable */
  }
}

export function useMyOrders() {
  const snapshot = useSyncExternalStore(
    (callback) => {
      window.addEventListener(EVENT, callback);
      window.addEventListener("storage", callback);
      return () => {
        window.removeEventListener(EVENT, callback);
        window.removeEventListener("storage", callback);
      };
    },
    read,
    () => null,
  );
  return { orders: parse(snapshot), ready: snapshot !== null };
}
