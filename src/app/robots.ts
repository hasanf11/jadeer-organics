import type { MetadataRoute } from "next";
import { searchIndexingEnabled, siteUrlOrLocal } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrlOrLocal().origin;
  if (!searchIndexingEnabled()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/checkout", "/bag", "/order/", "/wishlist"] },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
