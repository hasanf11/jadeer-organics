import ar from "@/lib/i18n/ar";
import en, { type Dictionary } from "@/lib/i18n/en";
import type { Locale } from "@/lib/i18n/config";

export type { Dictionary };

export function dictionary(locale: Locale): Dictionary {
  return locale === "ar" ? ar : en;
}
