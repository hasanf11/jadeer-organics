import type { Metadata } from "next";
import { getStorefront, toCardProduct } from "@/lib/catalog";
import WishlistGrid from "@/components/store/wishlist-grid";

export const metadata: Metadata = {
  title: "Your wishlist",
  robots: { index: false, follow: true },
};

export default async function WishlistPage() {
  const { products, settings } = await getStorefront();
  return (
    <div className="container-x pt-6 md:pt-10">
      <p className="eyebrow">Saved on this device</p>
      <h1 className="display-lg mt-3">Your wishlist</h1>
      <WishlistGrid products={products.map(toCardProduct)} lowStockThreshold={settings.low_stock_threshold} />
    </div>
  );
}
