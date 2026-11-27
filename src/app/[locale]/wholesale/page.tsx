import type { Metadata } from "next";
import Image from "next/image";
import { PiHandshakeBold, PiMegaphoneBold, PiTruckBold, PiTagBold } from "react-icons/pi";
import { getStorefront } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import ContactForm from "@/components/store/contact-form";
import Reveal from "@/components/motion/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return pageMetadata({ locale, title: t.wholesale.metaTitle, description: t.wholesale.metaDescription, path: "/wholesale" });
}

const icons = [PiTagBold, PiTruckBold, PiMegaphoneBold];
const tones = ["bg-sun text-forest", "bg-leaf text-white", "bg-berry text-white"];

export default async function WholesalePage() {
  const { t } = await getI18n();
  const { partners } = await getStorefront();
  return (
    <>
      <section className="grain relative overflow-hidden bg-teal text-white">
        <div className="container-x relative grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow text-lime"><PiHandshakeBold aria-hidden="true" /> {t.wholesale.eyebrow}</p>
            <h1 className="display-xl mt-3">{t.wholesale.title}</h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">{t.wholesale.intro}</p>
            {partners.length > 0 && <p className="mt-6 font-display text-xl text-white/70" dir="ltr">{partners.map((p) => p.name).join(" · ")}</p>}
          </div>
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-[2rem] lg:block">
            <Image src="/photos/syrup-collection.webp" alt="" fill sizes="40vw" className="object-cover" priority />
          </div>
        </div>
      </section>
      <section className="container-x mt-12">
        <Reveal stagger={0.08} className="grid gap-4 md:grid-cols-3">
          {t.wholesale.points.map(({ title, text }, i) => {
            const Icon = icons[i];
            return (
              <div key={title} className="rounded-3xl bg-paper p-7 shadow-soft">
                <span className={`grid size-12 place-items-center rounded-2xl ${tones[i]}`}><Icon size={24} aria-hidden="true" /></span>
                <h2 className="mt-5 text-2xl">{title}</h2>
                <p className="mt-2 text-ink-soft">{text}</p>
              </div>
            );
          })}
        </Reveal>
      </section>
      <section className="container-x mt-12 max-w-3xl">
        <ContactForm defaultTopic="wholesale" title={t.wholesale.formTitle} />
      </section>
    </>
  );
}
