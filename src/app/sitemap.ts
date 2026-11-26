import type { MetadataRoute } from "next";
import { getStorefront } from "@/lib/catalog";
import { imageUrl } from "@/lib/images";
import { siteUrlOrLocal } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrlOrLocal().origin;
  const { products, categories } = await getStorefront();
  const pages = ["", "/shop", "/stores", "/about", "/contact", "/faq", "/delivery", "/track", "/privacy", "/terms"];

  return [
    ...pages.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: path === "" || path === "/shop" ? ("daily" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.5,
    })),
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => {
      const images = p.images.map((i) => imageUrl(i.path)).filter((u): u is string => Boolean(u)).map((u) => (u.startsWith("/") ? `${base}${u}` : u));
      return { url: `${base}/products/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.7, ...(images.length ? { images } : {}) };
    }),
  ];
}
