import Image from "next/image";
import { PiClockBold, PiMapPinFill, PiNavigationArrowBold, PiPhoneBold } from "react-icons/pi";
import { getStorefront } from "@/lib/catalog";
import { googleDirectionsUrl, googleMapsEmbedUrl, googleMapsUrl } from "@/lib/maps";
import { pageMetadata } from "@/lib/seo";
import Reveal from "@/components/motion/reveal";

export const metadata = pageMetadata({
  title: "Our stores — Haret Hreik & Kayfoun",
  description:
    "Visit Ja'deer Organics in Haret Hreik (Beirut) and Kayfoun (Aley). Opening hours, directions and Google Maps links.",
  path: "/stores",
});

const photos = ["/instagram/post-23.webp", "/instagram/post-21.webp", "/instagram/post-24.webp"];
const colors = ["bg-mint", "bg-blush", "bg-butter", "bg-sky"];

export default async function StoresPage() {
  const { locations, settings } = await getStorefront();

  return (
    <>
      <section className="bg-blush">
        <div className="container-x py-10 md:py-16">
          <p className="eyebrow text-berry">Come visit</p>
          <h1 className="display-xl mt-2">Our stores</h1>
          <p className="arabic mt-2 text-2xl text-brown" dir="rtl" lang="ar">زورونا في فروعنا</p>
          <p className="mt-3 max-w-xl text-lg text-ink-soft">
            Taste, smell and discover everything in person. Tap a map to open the location in the Google Maps
            app on your phone.
          </p>
        </div>
      </section>

      <div className="container-x mt-10 grid gap-8">
        {locations.map((location, i) => (
          <Reveal key={location.id} className={`grid overflow-hidden rounded-[2rem] ${colors[i % colors.length]} lg:grid-cols-[1fr_1.2fr]`}>
            <div className="flex flex-col p-6 md:p-10">
              <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-3xl border-4 border-white shadow-soft">
                <Image src={photos[i % photos.length]} alt={location.name} fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
              </div>
              <h2 className="font-display text-3xl font-extrabold md:text-4xl">{location.area || location.name}</h2>
              {location.name_ar && <p className="arabic text-xl text-ink-soft" dir="rtl" lang="ar">{location.name_ar}</p>}
              <ul className="mt-5 grid gap-3 text-ink-soft">
                {location.address && (
                  <li className="flex gap-3"><PiMapPinFill size={22} className="shrink-0 text-tomato" /> {location.address}</li>
                )}
                {location.hours && (
                  <li className="flex gap-3"><PiClockBold size={22} className="shrink-0 text-leaf" /> {location.hours}</li>
                )}
                {(location.phone || settings.phone) && (
                  <li className="flex gap-3">
                    <PiPhoneBold size={22} className="shrink-0 text-berry" />
                    <a href={`tel:${(location.phone || settings.phone).replace(/[^+\d]/g, "")}`} className="font-bold hover:underline">
                      {location.phone || settings.phone}
                    </a>
                  </li>
                )}
              </ul>
              <div className="mt-auto flex flex-wrap gap-3 pt-7">
                <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <PiMapPinFill /> Open in Google Maps
                </a>
                <a href={googleDirectionsUrl(location)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  <PiNavigationArrowBold /> Directions
                </a>
              </div>
            </div>
            <a
              href={googleMapsUrl(location)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block min-h-72 bg-white"
              aria-label={`Open ${location.name} in Google Maps`}
            >
              <iframe
                src={googleMapsEmbedUrl(location)}
                title={`Map of ${location.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="pointer-events-none absolute inset-0 h-full w-full border-0"
                tabIndex={-1}
              />
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink px-5 py-3 font-bold text-cream shadow-pop transition-transform group-hover:scale-105">
                Tap to open map ↗
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </>
  );
}
