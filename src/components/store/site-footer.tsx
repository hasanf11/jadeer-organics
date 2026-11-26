import Link from "next/link";
import { cacheLife } from "next/cache";
import {
  PiFacebookLogoBold,
  PiHandCoinsBold,
  PiInstagramLogoBold,
  PiMapPinFill,
  PiTiktokLogoBold,
  PiTruckBold,
  PiWhatsappLogoBold,
  PiPlantBold,
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
    { href: settings.instagram_url, label: "Instagram", icon: PiInstagramLogoBold },
    { href: settings.facebook_url, label: "Facebook", icon: PiFacebookLogoBold },
    { href: settings.tiktok_url, label: "TikTok", icon: PiTiktokLogoBold },
    { href: whatsapp ? `https://wa.me/${whatsapp}` : "", label: "WhatsApp", icon: PiWhatsappLogoBold },
  ].filter((s) => s.href);

  return (
    <footer className="relative mt-24 bg-brown text-cream">
      <div className="absolute inset-x-0 -top-6 h-7 bg-brown wave-top" aria-hidden="true" />

      <div className="container-x grid gap-4 pt-14 sm:grid-cols-3">
        {[
          { icon: PiPlantBold, title: "100% organic", text: "Preservative & pesticide-free" },
          { icon: PiTruckBold, title: "Delivery all over Lebanon", text: "Same day in Beirut" },
          { icon: PiHandCoinsBold, title: "Cash on delivery", text: "Pay when your order arrives" },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3 rounded-2xl bg-white/8 p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sun text-brown">
              <Icon size={24} />
            </span>
            <span>
              <span className="block font-bold">{title}</span>
              <span className="text-sm text-cream/70">{text}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="container-x grid gap-12 py-14 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <span className="inline-block rounded-full bg-cream px-4 py-2">
            <Logo />
          </span>
          <p className="arabic mt-5 text-2xl text-sun" dir="rtl" lang="ar">
            أنت جدير بهذا النمط من الحياة
          </p>
          <p className="mt-1 text-cream/75">You deserve this way of life. Your health is our mission.</p>

          <div className="mt-8">
            <p className="font-display text-xl font-extrabold">Join the Ja&apos;deer club</p>
            <p className="mb-3 text-sm text-cream/70">New products, recipes and offers — no spam.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <p className="mb-3 font-display text-lg font-extrabold text-sun">Shop</p>
            <ul className="grid gap-2 text-cream/80">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/category/${category.slug}`} className="hover:text-white hover:underline">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 font-display text-lg font-extrabold text-sun">Help</p>
            <ul className="grid gap-2 text-cream/80">
              <li><Link href="/track" className="hover:text-white hover:underline">Track my order</Link></li>
              <li><Link href="/delivery" className="hover:text-white hover:underline">Delivery &amp; returns</Link></li>
              <li><Link href="/faq" className="hover:text-white hover:underline">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white hover:underline">Contact us</Link></li>
              <li><Link href="/about" className="hover:text-white hover:underline">Our story</Link></li>
              <li><Link href="/privacy" className="hover:text-white hover:underline">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-white hover:underline">Terms</Link></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="mb-3 font-display text-lg font-extrabold text-sun">Visit us</p>
            <ul className="grid gap-3">
              {locations.map((location) => (
                <li key={location.id}>
                  <a
                    href={googleMapsUrl(location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-2 text-cream/85 hover:text-white"
                  >
                    <PiMapPinFill className="mt-1 shrink-0 text-tomato transition-transform group-hover:-translate-y-0.5" size={18} />
                    <span>
                      <span className="block font-bold">{location.area || location.name}</span>
                      <span className="text-sm text-cream/65 underline-offset-2 group-hover:underline">Open in Google Maps</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            {socials.length > 0 && (
              <div className="mt-6 flex gap-2">
                {socials.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-sun hover:text-brown"
                  >
                    <Icon size={22} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <p
          aria-hidden="true"
          className="select-none text-center font-display text-[24vw] font-extrabold leading-[0.75] tracking-tighter text-white/[0.06]"
        >
          ja&apos;deer
        </p>
      </div>

      <div className="border-t border-white/10 pb-24 lg:pb-0">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-sm text-cream/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Ja&apos;deer Organics · By Rasha Yassine · Made with 💚 in Lebanon</p>
          <p>Prices in USD · Cash on delivery</p>
        </div>
      </div>
    </footer>
  );
}
