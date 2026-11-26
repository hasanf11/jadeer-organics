import type { ReactNode } from "react";
import { getStorefront, toClientCatalog } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n/server";
import { organizationJsonLd } from "@/lib/seo";
import { I18nProvider } from "@/components/i18n-provider";
import { StoreProvider } from "@/components/store/store-provider";
import SiteHeader from "@/components/store/site-header";
import SiteFooter from "@/components/store/site-footer";
import BagDrawer from "@/components/store/bag-drawer";
import SearchDialog from "@/components/store/search-dialog";
import MobileTabBar from "@/components/store/mobile-tab-bar";
import WhatsAppButton from "@/components/store/whatsapp-button";
import AnnouncementBar from "@/components/store/announcement-bar";
import SmoothScroll from "@/components/motion/smooth-scroll";
import JsonLd from "@/components/json-ld";

export default async function StoreShell({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const store = await getStorefront();

  return (
    <I18nProvider locale={locale}>
      <StoreProvider products={toClientCatalog(store.products)} settings={store.settings} zones={store.zones}>
        <JsonLd data={organizationJsonLd(store.settings, store.locations)} />
        <a
          href="#main"
          className="sr-only z-[70] rounded-full bg-ink px-4 py-2 font-bold text-cream focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
        >
          {locale === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}
        </a>
        {store.settings.announcement_enabled && <AnnouncementBar text={store.settings.announcement_text} />}
        <SiteHeader categories={store.categories.map(({ slug, name, image, productCount, color }) => ({ slug, name, image, productCount, color }))} />
        <main id="main" className="min-h-[60vh]">
          {children}
        </main>
        <SiteFooter settings={store.settings} categories={store.categories} locations={store.locations} locale={locale} />
        <MobileTabBar />
        <WhatsAppButton phone={store.settings.whatsapp} />
        <BagDrawer />
        <SearchDialog />
        <SmoothScroll />
      </StoreProvider>
    </I18nProvider>
  );
}
