"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { PiWhatsappLogoFill } from "react-icons/pi";
import { useI18n } from "@/components/i18n-provider";
import { stripLocale } from "@/lib/i18n/config";

export default function WhatsAppButton({ phone }: { phone: string }) {
  return (
    <Suspense fallback={<WhatsAppView phone={phone} pathname="/" />}>
      <WhatsAppWithPath phone={phone} />
    </Suspense>
  );
}

function WhatsAppWithPath({ phone }: { phone: string }) {
  return <WhatsAppView phone={phone} pathname={stripLocale(usePathname())} />;
}

function WhatsAppView({ phone, pathname }: { phone: string; pathname: string }) {
  const { t, locale } = useI18n();
  const digits = phone.replace(/\D/g, "");
  if (!digits || pathname.startsWith("/checkout")) return null;
  const greeting = locale === "ar" ? "مرحباً جدير، عندي سؤال." : "Hello Ja'deer, I have a question.";

  return (
    <a
      href={`https://wa.me/${digits}?text=${encodeURIComponent(greeting)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.common.whatsapp}
      className="group fixed bottom-[calc(4.4rem+env(safe-area-inset-bottom))] end-4 z-30 flex items-center gap-2 rounded-full bg-[#25d366] p-3 text-white shadow-pop transition-transform hover:scale-105 lg:bottom-6 lg:end-6"
    >
      <span aria-hidden="true" className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25d366]/40 [animation-duration:2.5s]" />
      <PiWhatsappLogoFill size={26} />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold transition-all duration-300 group-hover:max-w-40 group-hover:pe-2 lg:inline">
        {t.common.whatsapp}
      </span>
    </a>
  );
}
