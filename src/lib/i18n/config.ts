export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ar";
}

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * The public address of a page in a language. English lives at the root
 * ("/shop"), Arabic under "/ar" ("/ar/shop").
 */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === "en") return clean;
  return clean === "/" ? "/ar" : `/ar${clean}`;
}

/** The same page in the other language. */
export function switchLocalePath(pathname: string, target: Locale): string {
  return localePath(target, stripLocale(pathname));
}

/** "/ar/shop" or "/en/shop" → "/shop". */
export function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(ar|en)(?=\/|$)/);
  const rest = match ? pathname.slice(match[0].length) : pathname;
  return rest || "/";
}

/** Arabic units for product sizes ("500 ml" → "500 مل"). */
export function localizeLabel(label: string, locale: Locale, labelAr?: string): string {
  if (locale === "en") return label;
  if (labelAr) return labelAr;
  return label
    .replace(/\bml\b/gi, "مل")
    .replace(/\bL\b/g, "لتر")
    .replace(/\bkg\b/gi, "كغ")
    .replace(/\bg\b/g, "غ")
    .replace(/Gift set/i, "علبة هدية");
}
