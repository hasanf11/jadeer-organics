import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_SLOGAN, siteUrlOrLocal, searchIndexingEnabled } from "@/lib/site";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrlOrLocal(),
  title: {
    default: `${SITE_NAME} — Organic food & natural living in Lebanon`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "organic Lebanon",
    "Jadeer Organics",
    "Ja'deer",
    "جدير",
    "olive oil Lebanon",
    "pomegranate molasses",
    "healthy ketchup",
    "keto Lebanon",
    "jallab syrup",
    "matcha Lebanon",
    "organic shop Beirut",
    "Haret Hreik",
    "cash on delivery Lebanon",
  ],
  authors: [{ name: "Rasha Yassine" }],
  creator: SITE_NAME,
  category: "shopping",
  formatDetection: { telephone: false },
  robots: searchIndexingEnabled()
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
    : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${SITE_NAME} — ${SITE_SLOGAN}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_SLOGAN}`,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f5ee",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${arabic.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
