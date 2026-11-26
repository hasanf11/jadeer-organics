import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PiArrowLeftBold, PiArrowRightBold, PiFlaskBold, PiHeartBold, PiPlantBold, PiSealCheckBold } from "react-icons/pi";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import Reveal from "@/components/motion/reveal";
import CountUp from "@/components/motion/count-up";
import BlurText from "@/components/motion/blur-text";
import Aurora from "@/components/motion/aurora";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return pageMetadata({ locale, title: t.about.metaTitle, description: t.about.metaDescription, path: "/about" });
}

const icons = [PiSealCheckBold, PiFlaskBold, PiPlantBold, PiHeartBold];
const tones = ["bg-mint text-leaf", "bg-butter text-[#8a5a00]", "bg-blush text-berry", "bg-sky text-teal"];

export default async function AboutPage() {
  const { t, href, locale } = await getI18n();
  const Arrow = locale === "ar" ? PiArrowLeftBold : PiArrowRightBold;
  return (
    <>
      <section className="container-x grid items-center gap-10 py-10 md:py-16 lg:grid-cols-2">
        <div>
          <p className="eyebrow">{t.about.eyebrow}</p>
          <BlurText as="h1" className="display-xl mt-4" parts={[{ text: t.about.title1 }, { text: t.about.title2, className: "serif-italic text-tomato" }]} />
          <p className="mt-6 text-lg text-ink-soft">{t.about.p1}</p>
          <p className="mt-4 text-lg text-ink-soft">{t.about.p2}</p>
          <Link href={href("/shop")} className="btn btn-primary mt-8">{t.about.cta} <Arrow aria-hidden="true" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {["19", "29", "36", "07"].map((file, i) => (
            <div key={file} className={`relative aspect-[4/5] overflow-hidden rounded-3xl shadow-soft ${i % 2 ? "translate-y-8" : ""}`}>
              <Image src={`/instagram/post-${file}.webp`} alt="" fill sizes="(min-width: 1024px) 25vw, 45vw" className="object-cover" priority={i < 2} />
            </div>
          ))}
        </div>
      </section>

      <section className="container-x mt-16">
        <p className="eyebrow">{t.about.valuesEyebrow}</p>
        <Reveal stagger={0.1} className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.about.values.map(({ title, text }, i) => {
            const Icon = icons[i];
            return (
              <div key={title} className={`rounded-3xl p-7 ${tones[i].split(" ")[0]}`}>
                <span className={`grid size-12 place-items-center rounded-2xl bg-white ${tones[i].split(" ")[1]}`}><Icon size={24} aria-hidden="true" /></span>
                <h2 className="mt-5 text-2xl">{title}</h2>
                <p className="mt-2 text-ink-soft">{text}</p>
              </div>
            );
          })}
        </Reveal>
      </section>

      <section className="container-x mt-16">
        <div className="grain relative grid gap-8 overflow-hidden rounded-[2rem] bg-forest p-10 text-center text-cream sm:grid-cols-3 md:p-14">
          <Aurora colorStops={["#a8cc4a", "#f3b43c", "#f6c4ce"]} amplitude={0.8} className="opacity-40" />
          {[
            { to: 38.7, decimals: 1, suffix: "K" },
            { to: 35, decimals: 0, suffix: "+" },
            { to: 100, decimals: 0, suffix: "%" },
          ].map((stat, i) => (
            <div key={i} className="relative">
              <p className="font-display text-6xl text-sun" dir="ltr"><CountUp to={stat.to} decimals={stat.decimals} suffix={stat.suffix} /></p>
              <p className="mt-2 font-bold text-cream/80">{t.about.stats[i]}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
