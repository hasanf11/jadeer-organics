"use client";

import { useEffect } from "react";
import { saveOrder } from "@/lib/my-orders";

/** Keep this order under "My orders" on this device (e.g. opened from an email). */
export default function OrderSaver({ number, token, total, date }: { number: number; token: string; total: number; date: string }) {
  useEffect(() => {
    saveOrder({ number, token, total, date });
  }, [number, token, total, date]);
  return null;
}
