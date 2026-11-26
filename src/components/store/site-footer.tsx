import Link from "next/link";
import { cacheLife } from "next/cache";
import {
  PiFacebookLogo,
  PiHandCoins,
  PiInstagramLogo,
  PiLeaf,
  PiMapPin,
  PiTiktokLogo,
  PiTruck,
  PiWhatsappLogo,
} from "react-icons/pi";
import Logo from "@/components/logo";
import NewsletterForm from "@/components/store/newsletter-form";
import type { Category, StoreLocation, StoreSettings } from "@/lib/catalog";
import { googleMapsUrl } from "@/lib/maps";

export default async function SiteFooter({
  settings,
  categories,
  locations,
}: {
  settings: StoreSettings;
  categories: Category[];
  locations: StoreLocation[];
}) {
  "use cache";
  cacheLife("days");

  const whatsapp = settings.whatsapp.replace(/\D/g, "");
  const socials = [
    { href: settings.instagram_url, label: "Instagram", icon: PiInstagramLogo },
    { href: settings.facebook_url, label: "Facebook", icon: PiFacebookLogo },
    { href: settings.tiktok_url, label: "TikTok", icon: PiTiktokLogo },
    { href: whatsapp ? `https://wa.me/${whatsapp}` : "", label: "WhatsApp", icon: PiWhatsappLogo },
  ].filter((s) => s.href);

  const heading = "mb-4 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-cream/50";
  const link = "text-cream/80 transition-colors hover:text-white";

  return (
    <footer className="grain mt-28 bg-[#1d2a1f] text-cream">
      <div className="border-b border-white/10">
        <div className="container-x grid gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: PiLeaf, title: "Certified organic", text: "No preservatives, no pesticides" },
            { icon: PiTruck, title: "Delivery across Lebanon", text: "Same day in Beirut" },
            { icon: PiHandCoins, title: "Cash on delivery", text: "Pay when your order arrives" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4">
              <Icon size={28} className="shrink-0 text-sun" aria-hidden="true" />
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="text-sm text-cream/60">{text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="container-x grid gap-14 py-16 lg:grid-cols-[1.1fr_2fr]">
        <div>
          <Logo light />
          <p className="mt-6 max-w-sm font-display text-2xl leading-snug text-cream/90">
            You deserve this way of life. Your health is our mission.
          </p>
          <p className="arabic mt-2 text-lg text-cream/60" dir="rtl" lang="ar">
            أنت جدير بهذا النمط من الحياة
          </p>

          <div className="mt-10 max-w-md">
            <p className="font-semibold">Join our mailing list</p>
            <p className="mb-3 text-sm text-cream/60">New arrivals, seasonal recipes and private offers.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <div>
            <p className={heading}>Shop</p>
            <ul className="grid gap-2.5 text-[0.95rem]">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/category/${category.slug}`} className={link}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={heading}>Help</p>
            <ul className="grid gap-2.5 text-[0.95rem]">
              <li><Link href="/track" className={link}>Track my order</Link></li>
              <li><Link href="/delivery" className={link}>Delivery &amp; returns</Link></li>
              <li><Link href="/faq" className={link}>FAQ</Link></li>
              <li><Link href="/contact" className={link}>Contact us</Link></li>
              <li><Link href="/about" className={link}>Our story</Link></li>
              <li><Link href="/privacy" className={link}>Privacy</Link></li>
              <li><Link href="/terms" className={link}>Terms</Link></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className={heading}>Visit us</p>
            <ul className="grid gap-4">
              {locations.map((location) => (
                <li key={location.id}>
                  <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className="group flex gap-2.5">
                    <PiMapPin className="mt-1 shrink-0 text-sun" size={18} aria-hidden="true" />
                    <span>
                      <span className="block font-semibold text-cream">{location.area || location.name}</span>
                      <span className="text-sm text-cream/60 underline-offset-4 group-hover:underline">Open in Google Maps</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            {socials.length > 0 && (
              <div className="mt-8 flex gap-2">
                {socials.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid size-10 place-items-center rounded-full border border-white/20 text-cream/80 transition-colors hover:border-white hover:text-white"
                  >
                    <Icon size={19} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pb-24 lg:pb-0">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-cream/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Ja&apos;deer Organics · Founded by Rasha Yassine · Lebanon</p>
          <p>Prices in USD · Cash on delivery</p>
        </div>
      </div>
    </footer>
  );
}
