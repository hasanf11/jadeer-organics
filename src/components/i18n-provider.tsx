"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { dictionary, type Dictionary } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";

type I18n = { locale: Locale; t: Dictionary; href: (path: string) => string; rtl: boolean };

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(
    () => ({ locale, t: dictionary(locale), href: (path: string) => localePath(locale, path), rtl: locale === "ar" }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
