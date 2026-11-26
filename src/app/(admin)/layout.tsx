import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@/lib/fonts";
import { siteUrlOrLocal } from "@/lib/site";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrlOrLocal(),
  title: { default: "Admin", template: "%s · Ja'deer admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#173f28", width: "device-width", initialScale: 1 };

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={fontVariables} data-locale="en">
      <body>{children}</body>
    </html>
  );
}
