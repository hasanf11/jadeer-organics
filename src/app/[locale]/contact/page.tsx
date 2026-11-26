import type { Metadata } from "next";
import Link from "next/link";
import { PiEnvelopeSimpleBold, PiInstagramLogoBold, PiMapPinFill, PiPhoneBold, PiWhatsappLogoBold } from "react-icons/pi";
import { getStorefront } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n/server";
import { googleMapsUrl } from "@/lib/maps";
import { pageMetadata } from "@/lib/seo";
import ContactForm from "@/components/store/contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return pageMetadata({ locale, title: t.contact.metaTitle, description: t.contact.metaDescription, path: "/contact" });
}

export default async function ContactPage() {
  const { t, href } = await getI18n();
  const { settings, locations } = await getStorefront();
  const whatsapp = settings.whatsapp.replace(/\D/g, "");

  const channels = [
    whatsapp && { href: `https://wa.me/${whatsapp}`, label: t.common.whatsapp, value: settings.whatsapp, icon: PiWhatsappLogoBold, tone: "bg-[#25d366] text-white" },
    settings.phone && { href: `tel:${settings.phone.replace(/[^+\d]/g, "")}`, label: t.common.call, value: settings.phone, icon: PiPhoneBold, tone: "bg-sun text-forest" },
    settings.email && { href: `mailto:${settings.email}`, label: t.common.email, value: settings.email, icon: PiEnvelopeSimpleBold, tone: "bg-teal text-white" },
    settings.instagram_url && { href: settings.instagram_url, label: t.common.instagram, value: "@jadeer.organics", icon: PiInstagramLogoBold, tone: "bg-berry text-white" },
  ].filter(Boolean) as { href: string; label: string; value: string; icon: typeof PiPhoneBold; tone: string }[];

  return (
    <div className="container-x grid gap-10 pt-8 md:pt-14 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="eyebrow">{t.contact.eyebrow}</p>
        <h1 className="display-xl mt-3">{t.contact.title}</h1>
        <p className="mt-4 text-lg text-ink-soft">{t.contact.intro}</p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {channels.map(({ href: url, label, value, icon: Icon, tone }) => (
            <li key={label}>
              <a href={url} target={url.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex min-h-16 items-center gap-3 rounded-2xl bg-paper p-4 shadow-soft transition-shadow hover:shadow-pop">
                <span className={`grid size-11 shrink-0 place-items-center rounded-full ${tone}`}><Icon size={21} aria-hidden="true" /></span>
                <span className="min-w-0">
                  <span className="block font-bold">{label}</span>
                  <span className="block truncate text-sm text-ink-soft" dir="ltr">{value}</span>
                </span>
              </a>
            </li>
          ))}
          {locations.map((location) => (
            <li key={location.id}>
              <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className="flex min-h-16 items-center gap-3 rounded-2xl bg-paper p-4 shadow-soft transition-shadow hover:shadow-pop">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tomato text-white"><PiMapPinFill size={21} aria-hidden="true" /></span>
                <span className="min-w-0">
                  <span className="block font-bold">{location.area || location.name}</span>
                  <span className="block truncate text-sm text-ink-soft">{t.common.openInMaps}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-ink-soft">
          {t.contact.lookingForOrder} <Link href={href("/track")} className="font-bold text-leaf underline">{t.contact.trackHere}</Link>.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
