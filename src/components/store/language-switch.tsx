"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { PiGlobeSimpleBold } from "react-icons/pi";
import { useI18n } from "@/components/i18n-provider";
import { switchLocalePath } from "@/lib/i18n/config";

function SwitchLink({ pathname, className }: { pathname: string; className: string }) {
  const { locale, t } = useI18n();
  const target = locale === "en" ? "ar" : "en";
  return (
    <Link
      href={switchLocalePath(pathname, target)}
      hrefLang={target}
      lang={target}
      className={className}
      aria-label={t.common.switchLanguage}
      prefetch={false}
    >
      <PiGlobeSimpleBold size={17} aria-hidden="true" />
      <span className={target === "ar" ? "font-arabic" : ""}>{t.common.language}</span>
    </Link>
  );
}

function WithPath({ className }: { className: string }) {
  return <SwitchLink pathname={usePathname()} className={className} />;
}

/** Link to the same page in the other language. */
export default function LanguageSwitch({ className = "" }: { className?: string }) {
  const { locale } = useI18n();
  return (
    <Suspense fallback={<SwitchLink pathname={locale === "ar" ? "/ar" : "/"} className={className} />}>
      <WithPath className={className} />
    </Suspense>
  );
}
