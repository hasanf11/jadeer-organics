import Link from "next/link";
import { cacheLife } from "next/cache";
import {
  PiEnvelopeSimpleBold,
  PiFacebookLogoBold,
  PiHandCoinsBold,
  PiInstagramLogoBold,
  PiMapPinFill,
  PiPhoneBold,
  PiSealCheckBold,
  PiTiktokLogoBold,
  PiTruckBold,
  PiWhatsappLogoBold,
} from "react-icons/pi";
import Logo from "@/components/logo";
import NewsletterForm from "@/components/store/newsletter-form";
import { dictionary } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Category, StoreLocation, StoreSettings } from "@/lib/catalog";
import { googleMapsUrl } from "@/lib/maps";

export default async function SiteFooter({
  settings,
  categories,
  locations,
  locale,
}: {
  settings: StoreSettings;
  categories: Category[];
  locations: StoreLocation[];
  locale: Locale;
}) {
  "use cache";
  cacheLife("days");

  const t = dictionary(locale);
  const href = (path: string) => localePath(locale, path);
  const whatsapp = settings.whatsapp.replace(/\D/g, "");
  const socials = [
    { href: settings.instagram_url, label: t.common.instagram, icon: PiInstagramLogoBold },
    { href: settings.facebook_url, label: "Facebook", icon: PiFacebookLogoBold },
    { href: settings.tiktok_url, label: "TikTok", icon: PiTiktokLogoBold },
    { href: whatsapp ? `https://wa.me/${whatsapp}` : "", label: t.common.whatsapp, icon: PiWhatsappLogoBold },
    { href: settings.email ? `mailto:${settings.email}` : "", label: t.common.email, icon: PiEnvelopeSimpleBold },
  ].filter((s) => s.href);
  const trustIcons = [PiSealCheckBold, PiTruckBold, PiHandCoinsBold];

  const heading = "mb-4 text-[0.72rem] font-extrabold text-sun en:uppercase en:tracking-[0.2em] ar:text-sm";
  const link = "text-cream/75 transition-colors hover:text-white";

  return (
    <footer className="grain mt-24 bg-forest text-cream">
      <div className="border-b border-white/10">
        <div className="container-x grid gap-5 py-8 sm:grid-cols-3">
          {t.footer.trust.map(({ title, text }, i) => {
            const Icon = trustIcons[i];
            return (
              <div key={title} className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sun text-forest">
                  <Icon size={23} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-bold">{title}</span>
                  <span className="text-sm text-cream/60">{text}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="container-x grid gap-12 py-14 lg:grid-cols-[1.15fr_2fr] lg:gap-16 [&>*]:min-w-0">
        <div>
          <Logo light locale={locale} />
          <p className="mt-6 max-w-sm font-display text-2xl leading-snug text-cream/95">{t.footer.tagline}</p>
          <div className="mt-9 max-w-md">
            <p className="font-bold">{t.footer.newsletter}</p>
            <p className="mb-3 text-sm text-cream/60">{t.footer.newsletterText}</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-10 break-words sm:grid-cols-3 sm:gap-x-10 [&>*]:min-w-0">
          <div>
            <p className={heading}>{t.footer.shop}</p>
            <ul className="grid gap-2.5 text-[0.95rem]">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={href(`/category/${category.slug}`)} className={link}>{category.name}</Link>
                </li>
              ))}
              <li><Link href={href("/offers")} className={link}>{t.nav.offers}</Link></li>
            </ul>
          </div>
          <div>
            <p className={heading}>{t.footer.help}</p>
            <ul className="grid gap-2.5 text-[0.95rem]">
              <li><Link href={href("/orders")} className={link}>{t.nav.myOrders}</Link></li>
              <li><Link href={href("/track")} className={link}>{t.nav.track}</Link></li>
              <li><Link href={href("/delivery")} className={link}>{t.footer.deliveryReturns}</Link></li>
              <li><Link href={href("/faq")} className={link}>{t.nav.faq}</Link></li>
              <li><Link href={href("/contact")} className={link}>{t.nav.contact}</Link></li>
              <li><Link href={href("/wholesale")} className={link}>{t.nav.wholesale}</Link></li>
              <li><Link href={href("/journal")} className={link}>{t.nav.journal}</Link></li>
              <li><Link href={href("/about")} className={link}>{t.nav.story}</Link></li>
              <li><Link href={href("/privacy")} className={link}>{t.footer.privacy}</Link></li>
              <li><Link href={href("/terms")} className={link}>{t.footer.terms}</Link></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className={heading}>{t.footer.visit}</p>
            <ul className="grid gap-4">
              {locations.map((location) => (
                <li key={location.id}>
                  <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className="group flex gap-2.5">
                    <PiMapPinFill className="mt-1 shrink-0 text-tomato" size={18} aria-hidden="true" />
                    <span>
                      <span className="block font-bold text-cream">{location.area || location.name}</span>
                      <span className="text-sm text-cream/60 underline-offset-4 group-hover:underline">{t.common.openInMaps}</span>
                    </span>
                  </a>
                </li>
              ))}
              {settings.phone && (
                <li>
                  <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2.5 text-cream/80 hover:text-white">
                    <PiPhoneBold size={18} className="text-sun" aria-hidden="true" />
                    <span dir="ltr">{settings.phone}</span>
                  </a>
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2">
                {socials.map(({ href: url, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={url}
                    target={url.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-sun hover:text-forest"
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-cream/55 sm:flex-row">
          <p>© {new Date().getFullYear()} {t.meta.siteName} · {t.footer.rights}</p>
          <p>{t.common.priceUsd} · {t.common.cod}</p>
        </div>
      </div>
    </footer>
  );
}
