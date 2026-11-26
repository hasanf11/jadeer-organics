import type { MetadataRoute } from "next";
import { searchIndexingEnabled, siteUrlOrLocal } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrlOrLocal().origin;
  if (!searchIndexingEnabled()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/checkout", "/bag", "/order/", "/wishlist", "/orders", "/ar/checkout", "/ar/bag", "/ar/order/", "/ar/wishlist", "/ar/orders"] },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
