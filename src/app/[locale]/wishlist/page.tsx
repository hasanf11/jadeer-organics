import type { Metadata } from "next";
import { getStorefront, toCardProduct } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n/server";
import WishlistGrid from "@/components/store/wishlist-grid";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.wishlist.metaTitle, robots: { index: false, follow: true } };
}

export default async function WishlistPage() {
  const { t } = await getI18n();
  const { products, settings } = await getStorefront();
  return (
    <div className="container-x pt-8 md:pt-12">
      <p className="eyebrow text-berry">{t.wishlist.eyebrow}</p>
      <h1 className="display-lg mt-3">{t.wishlist.title}</h1>
      <WishlistGrid products={products.map(toCardProduct)} lowStockThreshold={settings.low_stock_threshold} />
    </div>
  );
}
