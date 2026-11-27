import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PiArrowLeftBold, PiArrowRightBold, PiCheckCircleFill, PiTimerBold, PiUsersBold } from "react-icons/pi";
import { getStorefront, toCardProduct } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n/server";
import { RECIPES, recipeText } from "@/lib/journal";
import { pageMetadata } from "@/lib/seo";
import ProductCard from "@/components/store/product-card";
import JsonLd from "@/components/json-ld";
import { siteUrlOrLocal } from "@/lib/site";

export function generateStaticParams() {
  return RECIPES.map((recipe) => ({ slug: recipe.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/journal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getI18n();
  const recipe = RECIPES.find((r) => r.slug === slug);
  if (!recipe) return {};
  const text = recipeText(recipe, locale);
  return pageMetadata({ locale, title: text.title, description: text.intro, path: `/journal/${recipe.slug}`, image: recipe.image });
}

export default async function RecipePage({ params }: PageProps<"/[locale]/journal/[slug]">) {
  const { slug } = await params;
  const recipe = RECIPES.find((r) => r.slug === slug);
  if (!recipe) notFound();
  const { t, href, locale } = await getI18n();
  const { products, settings } = await getStorefront();
  const text = recipeText(recipe, locale);
  const used = recipe.products.map((s) => products.find((p) => p.slug === s)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const Back = locale === "ar" ? PiArrowRightBold : PiArrowLeftBold;

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Recipe",
          name: text.title,
          description: text.intro,
          image: new URL(recipe.image, siteUrlOrLocal()).toString(),
          totalTime: `PT${recipe.minutes}M`,
          recipeYield: String(recipe.serves),
          recipeIngredient: text.ingredients,
          recipeInstructions: text.steps.map((step) => ({ "@type": "HowToStep", text: step })),
          inLanguage: locale,
          author: { "@type": "Organization", name: t.meta.siteName },
        }}
      />
      <div className="container-x pt-6 md:pt-10">
        <Link href={href("/journal")} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink-soft hover:text-ink">
          <Back aria-hidden="true" /> {t.nav.journal}
        </Link>
        <div className="mt-4 grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h1 className="display-xl">{text.title}</h1>
            <p className="mt-4 text-lg text-ink-soft">{text.intro}</p>
            <p className="mt-5 flex gap-5 font-bold">
              <span className="flex items-center gap-1.5"><PiTimerBold className="text-tomato" aria-hidden="true" /> {t.journal.minutes(recipe.minutes)}</span>
              <span className="flex items-center gap-1.5"><PiUsersBold className="text-tomato" aria-hidden="true" /> {t.journal.serves(recipe.serves)}</span>
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]" style={{ background: recipe.color }}>
            <Image src={recipe.image} quality={85} style={{ objectPosition: recipe.focus }} alt={text.title} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          <section className="rounded-3xl bg-butter p-6 md:p-8">
            <h2 className="text-2xl">{t.journal.ingredients}</h2>
            <ul className="mt-4 grid gap-3">
              {text.ingredients.map((item) => (
                <li key={item} className="flex gap-3"><PiCheckCircleFill className="mt-1 shrink-0 text-leaf" aria-hidden="true" /> {item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-2xl">{t.journal.steps}</h2>
            <ol className="mt-4 grid gap-4">
              {text.steps.map((step, i) => (
                <li key={step} className="flex gap-4 rounded-3xl bg-paper p-5 shadow-soft">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tomato font-display text-lg text-white">{i + 1}</span>
                  <p className="pt-1.5">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {used.length > 0 && (
          <section className="mt-16">
            <h2 className="display-lg">{t.journal.shopIngredients}</h2>
            <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-4">
              {used.map((p) => <ProductCard key={p.id} product={toCardProduct(p)} lowStockThreshold={settings.low_stock_threshold} />)}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
