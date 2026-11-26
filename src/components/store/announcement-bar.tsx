"use client";

import { PiSealCheckFill } from "react-icons/pi";
import { useI18n } from "@/components/i18n-provider";
import Marquee from "@/components/motion/marquee";

export default function AnnouncementBar({ text }: { text: string }) {
  const { t } = useI18n();
  const items = [text, ...t.announcement].filter(Boolean);
  return (
    <div className="bg-forest py-2 text-[0.74rem] font-bold text-cream/90 en:uppercase en:tracking-[0.16em]">
      <p className="sr-only">{text}</p>
      <Marquee duration={40}>
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-3 px-5">
            <PiSealCheckFill className="text-sun" size={14} aria-hidden="true" />
            {item}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
