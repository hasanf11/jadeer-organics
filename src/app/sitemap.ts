import type { MetadataRoute } from "next";
import { getStorefrontFor } from "@/lib/catalog";
import { localePath } from "@/lib/i18n/config";
import { imageUrl } from "@/lib/images";
import { RECIPES } from "@/lib/journal";
import { siteUrlOrLocal } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrlOrLocal().origin;
  const { products, categories } = await getStorefrontFor("en");

  const entry = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly", images?: string[]) =>
    (["en", "ar"] as const).map((locale) => ({
      url: `${base}${localePath(locale, path)}`,
      changeFrequency,
      priority: locale === "en" ? priority : Math.max(0.1, priority - 0.1),
      alternates: { languages: { en: `${base}${localePath("en", path)}`, ar: `${base}${localePath("ar", path)}` } },
      ...(images?.length ? { images } : {}),
    }));

  const pages = ["/shop", "/offers", "/stores", "/about", "/journal", "/contact", "/wholesale", "/faq", "/delivery", "/track", "/privacy", "/terms"];

  return [
    ...entry("/", 1, "daily"),
    ...pages.flatMap((path) => entry(path, path === "/shop" ? 0.9 : 0.5, path === "/shop" || path === "/offers" ? "daily" : "monthly")),
    ...categories.flatMap((c) => entry(`/category/${c.slug}`, 0.8, "weekly")),
    ...products.flatMap((p) => {
      const images = p.images.map((i) => imageUrl(i.path)).filter((u): u is string => Boolean(u)).map((u) => (u.startsWith("/") ? `${base}${u}` : u));
      return entry(`/products/${p.slug}`, 0.7, "weekly", images);
    }),
    ...RECIPES.flatMap((r) => entry(`/journal/${r.slug}`, 0.6, "monthly", [`${base}${r.image}`])),
  ];
}
