import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import StoreShell from "@/components/store/store-shell";
import { fontVariables } from "@/lib/fonts";
import { dictionary } from "@/lib/i18n";
import { dirOf, LOCALES } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { searchIndexingEnabled, siteUrlOrLocal } from "@/lib/site";
import "../globals.css";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = dictionary(locale);
  return {
    metadataBase: siteUrlOrLocal(),
    title: { default: t.meta.title, template: `%s | ${t.meta.siteName}` },
    description: t.meta.description,
    applicationName: t.meta.siteName,
    keywords: [
      "organic Lebanon", "Jadeer Organics", "Ja'deer", "جدير", "منتجات عضوية لبنان", "olive oil Lebanon",
      "pomegranate molasses", "دبس رمان", "healthy ketchup", "keto Lebanon", "jallab", "matcha Lebanon",
      "organic shop Beirut", "Haret Hreik", "Kayfoun", "cash on delivery Lebanon",
    ],
    authors: [{ name: "Rasha Yassine" }],
    creator: t.meta.siteName,
    category: "shopping",
    formatDetection: { telephone: false },
    robots: searchIndexingEnabled()
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: t.meta.siteName,
      locale: locale === "ar" ? "ar_LB" : "en_US",
      alternateLocale: locale === "ar" ? "en_US" : "ar_LB",
      title: `${t.meta.siteName} — ${t.meta.slogan}`,
      description: t.meta.description,
    },
    twitter: { card: "summary_large_image", title: `${t.meta.siteName} — ${t.meta.slogan}`, description: t.meta.description },
  };
}

export const viewport: Viewport = {
  themeColor: "#173f28",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dirOf(locale)} className={fontVariables} data-locale={locale}>
      <body>
        <StoreShell>{children}</StoreShell>
      </body>
    </html>
  );
}
