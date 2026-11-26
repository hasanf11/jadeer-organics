"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ClientProduct, DeliveryZone, StoreSettings, Variant } from "@/lib/catalog";

type StoreContextValue = {
  products: ClientProduct[];
  settings: StoreSettings;
  zones: DeliveryZone[];
  variantIndex: Map<string, { product: ClientProduct; variant: Variant }>;
  productIndex: Map<string, ClientProduct>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  products,
  settings,
  zones,
  children,
}: {
  products: ClientProduct[];
  settings: StoreSettings;
  zones: DeliveryZone[];
  children: ReactNode;
}) {
  const value = useMemo(() => {
    const variantIndex = new Map<string, { product: ClientProduct; variant: Variant }>();
    const productIndex = new Map<string, ClientProduct>();
    for (const product of products) {
      productIndex.set(product.id, product);
      for (const variant of product.variants) {
        variantIndex.set(variant.id, { product, variant });
      }
    }
    return { products, settings, zones, variantIndex, productIndex };
  }, [products, settings, zones]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}
