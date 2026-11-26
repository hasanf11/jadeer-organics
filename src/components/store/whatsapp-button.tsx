"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { PiWhatsappLogoFill } from "react-icons/pi";

export default function WhatsAppButton({ phone }: { phone: string }) {
  return (
    <Suspense fallback={<WhatsAppView phone={phone} pathname="" />}>
      <WhatsAppWithPath phone={phone} />
    </Suspense>
  );
}

function WhatsAppWithPath({ phone }: { phone: string }) {
  return <WhatsAppView phone={phone} pathname={usePathname()} />;
}

function WhatsAppView({ phone, pathname }: { phone: string; pathname: string }) {
  const digits = phone.replace(/\D/g, "");
  if (!digits || pathname.startsWith("/checkout")) return null;

  return (
    <a
      href={`https://wa.me/${digits}?text=${encodeURIComponent("Hello Ja'deer! 🌿 I have a question.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-[#25d366] p-3.5 text-white shadow-pop transition-transform hover:scale-105 lg:bottom-6 lg:right-6"
    >
      <PiWhatsappLogoFill size={28} />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap font-bold transition-all duration-300 group-hover:max-w-40 group-hover:pr-2 lg:inline">
        Chat with us
      </span>
    </a>
  );
}
