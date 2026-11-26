import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PiBookOpenTextBold, PiTimerBold, PiUsersBold } from "react-icons/pi";
import { getI18n } from "@/lib/i18n/server";
import { RECIPES, recipeText } from "@/lib/journal";
import { pageMetadata } from "@/lib/seo";
import Reveal from "@/components/motion/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return pageMetadata({ locale, title: t.journal.metaTitle, description: t.journal.metaDescription, path: "/journal" });
}

export default async function JournalPage() {
  const { t, href, locale } = await getI18n();
  return (
    <>
      <section className="grain relative overflow-hidden bg-sun text-forest">
        <div className="container-x relative py-12 md:py-16">
          <p className="eyebrow text-berry"><PiBookOpenTextBold aria-hidden="true" /> {t.journal.eyebrow}</p>
          <h1 className="display-xl mt-3">{t.journal.title}</h1>
          <p className="mt-3 max-w-xl text-lg text-forest/80">{t.journal.intro}</p>
        </div>
      </section>
      <Reveal stagger={0.08} className="container-x mt-12 grid gap-8 md:grid-cols-2">
        {RECIPES.map((recipe, i) => {
          const text = recipeText(recipe, locale);
          return (
            <Link key={recipe.slug} href={href(`/journal/${recipe.slug}`)} className="group block">
              <span className={`relative block overflow-hidden rounded-[2rem] ${i === 0 ? "aspect-[4/3]" : "aspect-[4/3]"}`} style={{ background: recipe.color }}>
                <Image src={recipe.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" priority={i < 2} />
              </span>
              <span className="mt-4 flex gap-4 text-sm font-bold text-ink-soft">
                <span className="flex items-center gap-1"><PiTimerBold aria-hidden="true" /> {t.journal.minutes(recipe.minutes)}</span>
                <span className="flex items-center gap-1"><PiUsersBold aria-hidden="true" /> {t.journal.serves(recipe.serves)}</span>
              </span>
              <span className="mt-2 block font-display text-3xl leading-tight group-hover:text-tomato">{text.title}</span>
              <span className="mt-2 block text-ink-soft">{text.intro}</span>
              <span className="mt-3 inline-block font-bold text-leaf underline underline-offset-4">{t.journal.read}</span>
            </Link>
          );
        })}
      </Reveal>
    </>
  );
}
