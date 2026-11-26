import type { ReactNode } from "react";
import { getStorefront, toClientCatalog } from "@/lib/catalog";
import { StoreProvider } from "@/components/store/store-provider";
import SiteHeader from "@/components/store/site-header";
import SiteFooter from "@/components/store/site-footer";
import BagDrawer from "@/components/store/bag-drawer";
import SearchDialog from "@/components/store/search-dialog";
import MobileTabBar from "@/components/store/mobile-tab-bar";
import WhatsAppButton from "@/components/store/whatsapp-button";
import AnnouncementBar from "@/components/store/announcement-bar";
import SmoothScroll from "@/components/motion/smooth-scroll";
import ClickSpark from "@/components/motion/click-spark";
import JsonLd from "@/components/json-ld";
import { organizationJsonLd } from "@/lib/seo";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const store = await getStorefront();

  return (
    <StoreProvider products={toClientCatalog(store.products)} settings={store.settings} zones={store.zones}>
      <JsonLd data={organizationJsonLd(store.settings, store.locations)} />
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-ink px-4 py-2 font-bold text-cream focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      {store.settings.announcement_enabled && store.settings.announcement_text && (
        <AnnouncementBar text={store.settings.announcement_text} />
      )}
      <SiteHeader
        categories={store.categories.map(({ slug, name, nameAr, emoji, color }) => ({ slug, name, nameAr, emoji, color }))}
      />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter settings={store.settings} categories={store.categories} locations={store.locations} />
      <MobileTabBar />
      <WhatsAppButton phone={store.settings.whatsapp} />
      <BagDrawer />
      <SearchDialog />
      <SmoothScroll />
      <ClickSpark />
    </StoreProvider>
  );
}
