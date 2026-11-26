import type { Metadata } from "next";
import Image from "next/image";
import { PiClockBold, PiMapPinFill, PiNavigationArrowBold, PiPhoneBold } from "react-icons/pi";
import { getStorefront } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n/server";
import { googleDirectionsUrl, googleMapsEmbedUrl, googleMapsUrl } from "@/lib/maps";
import { pageMetadata } from "@/lib/seo";
import Reveal from "@/components/motion/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return pageMetadata({ locale, title: t.stores.metaTitle, description: t.stores.metaDescription, path: "/stores" });
}

const photos = ["/instagram/post-33.webp", "/instagram/post-30.webp", "/instagram/post-34.webp"];
const tones = ["bg-mint", "bg-blush", "bg-butter"];

export default async function StoresPage() {
  const { t, locale } = await getI18n();
  const { locations, settings } = await getStorefront();

  return (
    <>
      <section className="grain relative overflow-hidden bg-tomato text-white">
        <div aria-hidden="true" className="absolute -bottom-24 -end-20 size-80 rounded-full bg-sun/40 blur-3xl" />
        <div className="container-x relative py-12 md:py-16">
          <p className="eyebrow text-butter">{t.stores.eyebrow}</p>
          <h1 className="display-xl mt-3">{t.stores.title}</h1>
          <p className="mt-3 max-w-xl text-lg text-white/85">{t.stores.intro}</p>
        </div>
      </section>

      <div className="container-x mt-10 grid gap-8">
        {locations.map((location, i) => {
          const phone = location.phone || settings.phone;
          return (
            <Reveal key={location.id} className={`grid overflow-hidden rounded-[2rem] ${tones[i % tones.length]} lg:grid-cols-[1fr_1.2fr]`}>
              <div className="flex flex-col p-6 md:p-10">
                <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-3xl shadow-soft">
                  <Image src={photos[i % photos.length]} alt={location.name} fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
                </div>
                <h2 className="font-display text-3xl md:text-4xl">{location.area || location.name}</h2>
                <ul className="mt-5 grid gap-3 text-ink-soft">
                  {location.address && <li className="flex gap-3"><PiMapPinFill size={20} className="shrink-0 text-tomato" aria-hidden="true" /> {location.address}</li>}
                  {location.hours && <li className="flex gap-3"><PiClockBold size={20} className="shrink-0 text-leaf" aria-hidden="true" /> {location.hours}</li>}
                  {phone && (
                    <li className="flex gap-3">
                      <PiPhoneBold size={20} className="shrink-0 text-berry" aria-hidden="true" />
                      <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="font-bold hover:underline" dir="ltr">{phone}</a>
                    </li>
                  )}
                </ul>
                <div className="mt-auto flex flex-wrap gap-3 pt-7">
                  <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    <PiMapPinFill aria-hidden="true" /> {t.common.openInMaps}
                  </a>
                  <a href={googleDirectionsUrl(location)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                    <PiNavigationArrowBold aria-hidden="true" /> {t.common.directions}
                  </a>
                </div>
              </div>
              <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className="group relative block min-h-72 bg-white" aria-label={`${t.common.openInMaps}: ${location.name}`}>
                <iframe
                  src={`${googleMapsEmbedUrl(location)}&hl=${locale}`}
                  title={t.stores.mapTitle(location.name)}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="pointer-events-none absolute inset-0 h-full w-full border-0"
                  tabIndex={-1}
                />
                <span className="absolute bottom-4 start-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-cream shadow-pop rtl:translate-x-1/2">
                  <PiMapPinFill className="text-tomato" aria-hidden="true" /> {t.common.openInMaps}
                </span>
              </a>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
