import Link from "next/link";
import { PiEnvelopeSimpleBold, PiInstagramLogoBold, PiMapPinFill, PiPhoneBold, PiWhatsappLogoBold } from "react-icons/pi";
import { getStorefront } from "@/lib/catalog";
import { googleMapsUrl } from "@/lib/maps";
import { pageMetadata } from "@/lib/seo";
import ContactForm from "@/components/store/contact-form";

export const metadata = pageMetadata({
  title: "Contact us",
  description: "Questions about an order, a product or wholesale? Contact Ja'deer Organics by WhatsApp, phone, email or our contact form.",
  path: "/contact",
});

export default async function ContactPage() {
  const { settings, locations } = await getStorefront();
  const whatsapp = settings.whatsapp.replace(/\D/g, "");

  const channels = [
    whatsapp && { href: `https://wa.me/${whatsapp}`, label: "WhatsApp", value: settings.whatsapp, icon: PiWhatsappLogoBold, bg: "bg-[#d9f7e3]", color: "text-[#128c4a]" },
    settings.phone && { href: `tel:${settings.phone.replace(/[^+\d]/g, "")}`, label: "Call us", value: settings.phone, icon: PiPhoneBold, bg: "bg-butter", color: "text-[#8a5a00]" },
    settings.email && { href: `mailto:${settings.email}`, label: "Email", value: settings.email, icon: PiEnvelopeSimpleBold, bg: "bg-sky", color: "text-[#0b5f7a]" },
    settings.instagram_url && { href: settings.instagram_url, label: "Instagram", value: "@jadeer.organics", icon: PiInstagramLogoBold, bg: "bg-blush", color: "text-berry" },
  ].filter(Boolean) as { href: string; label: string; value: string; icon: typeof PiPhoneBold; bg: string; color: string }[];

  return (
    <div className="container-x grid gap-10 pt-8 md:pt-14 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="eyebrow">We&apos;d love to hear from you</p>
        <h1 className="display-xl mt-2">Say hello 👋</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Questions about a product, your order, or stocking Ja&apos;deer in your shop? Send us a message and
          we&apos;ll get back to you quickly.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {channels.map(({ href, label, value, icon: Icon, bg, color }) => (
            <li key={label}>
              <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={`flex items-center gap-3 rounded-2xl p-4 transition-transform hover:-translate-y-0.5 ${bg}`}>
                <span className={`grid size-12 place-items-center rounded-full bg-white ${color}`}><Icon size={24} /></span>
                <span className="min-w-0">
                  <span className="block font-bold">{label}</span>
                  <span className="block truncate text-sm text-ink-soft">{value}</span>
                </span>
              </a>
            </li>
          ))}
          {locations.map((location) => (
            <li key={location.id}>
              <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl bg-mint p-4 transition-transform hover:-translate-y-0.5">
                <span className="grid size-12 place-items-center rounded-full bg-white text-tomato"><PiMapPinFill size={24} /></span>
                <span className="min-w-0">
                  <span className="block font-bold">{location.area || location.name}</span>
                  <span className="block truncate text-sm text-ink-soft">Open in Google Maps</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-ink-soft">
          Looking for an order? <Link href="/track" className="font-bold text-leaf underline">Track it here</Link>.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
