import type { Metadata } from "next";
import { PiGiftBold, PiPercentBold } from "react-icons/pi";
import { getStorefront, toCardProduct } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import ProductCard from "@/components/store/product-card";
import CopyCode from "@/components/store/copy-code";
import Aurora from "@/components/motion/aurora";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return pageMetadata({ locale, title: t.offers.metaTitle, description: t.offers.metaDescription, path: "/offers" });
}

export default async function OffersPage() {
  const { t } = await getI18n();
  const { products, settings } = await getStorefront();
  const onSale = products.filter((p) => p.variants.some((v) => v.compareAt && v.compareAt > v.price));
  const gifts = products.filter((p) => p.art.shape === "box" || /trio|gift|set/i.test(p.nameEn));

  return (
    <>
      <section className="grain relative overflow-hidden bg-berry text-white">
        <Aurora colorStops={["#f6c4ce", "#f3b43c", "#e0592a"]} amplitude={0.9} className="opacity-50" />
        <div className="container-x relative grid items-center gap-8 py-12 md:py-16 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow text-pink"><PiPercentBold aria-hidden="true" /> {t.offers.eyebrow}</p>
            <h1 className="display-xl mt-3">{t.offers.title}</h1>
            <p className="mt-3 max-w-xl text-lg text-white/85">{t.offers.intro}</p>
          </div>
          <div className="rounded-[2rem] bg-white/95 p-6 text-ink shadow-pop md:p-8">
            <p className="flex items-center gap-2 font-bold text-berry"><PiGiftBold aria-hidden="true" /> {t.offers.codeTitle}</p>
            <p className="mt-2 text-ink-soft">{t.offers.codeText("WELCOME10")}</p>
            <CopyCode code="WELCOME10" />
          </div>
        </div>
      </section>

      {onSale.length > 0 && (
        <section className="container-x mt-14">
          <h2 className="display-lg">{t.offers.onSale}</h2>
          <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-4">
            {onSale.map((p) => <ProductCard key={p.id} product={toCardProduct(p)} lowStockThreshold={settings.low_stock_threshold} />)}
          </div>
        </section>
      )}
      {gifts.length > 0 && (
        <section className="container-x mt-14">
          <h2 className="display-lg">{t.offers.gifts}</h2>
          <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-4">
            {gifts.map((p) => <ProductCard key={p.id} product={toCardProduct(p)} lowStockThreshold={settings.low_stock_threshold} />)}
          </div>
        </section>
      )}
      {onSale.length === 0 && gifts.length === 0 && <p className="container-x mt-14 text-center text-ink-soft">{t.offers.none}</p>}
    </>
  );
}
