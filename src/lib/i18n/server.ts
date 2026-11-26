import { locale as rootLocale } from "next/root-params";
import { dictionary } from "@/lib/i18n";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";

/** The language of the page being rendered (from the /[locale] segment). */
export async function getLocale(): Promise<Locale> {
  const value = await rootLocale();
  return isLocale(value) ? value : "en";
}

export async function getI18n() {
  const locale = await getLocale();
  return {
    locale,
    t: dictionary(locale),
    href: (path: string) => localePath(locale, path),
  };
}
