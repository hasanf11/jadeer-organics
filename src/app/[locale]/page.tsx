import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  PiArrowLeftBold,
  PiArrowRightBold,
  PiArrowUpRightBold,
  PiClockBold,
  PiFlaskBold,
  PiInstagramLogoBold,
  PiLeafBold,
  PiMapPinFill,
  PiNavigationArrowBold,
  PiPlantBold,
  PiSealCheckBold,
  PiTimerBold,
} from "react-icons/pi";
import { getStorefront, toCardProduct } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n/server";
import { imageUrl } from "@/lib/images";
import { googleDirectionsUrl, googleMapsUrl } from "@/lib/maps";
import { shortMoney } from "@/lib/format";
import { RECIPES, recipeText } from "@/lib/journal";
import { pageMetadata } from "@/lib/seo";
import Aurora from "@/components/motion/aurora";
import BlurText from "@/components/motion/blur-text";
import CardSwap from "@/components/motion/card-swap";
import CountUp from "@/components/motion/count-up";
import Magnet from "@/components/motion/magnet";
import Marquee from "@/components/motion/marquee";
import Reveal from "@/components/motion/reveal";
import SpotlightCard from "@/components/motion/spotlight-card";
import StarBorder from "@/components/motion/star-border";
import FeaturedTabs from "@/components/store/featured-tabs";
import CategoryIcon from "@/components/store/category-icon";
import NewsletterForm from "@/components/store/newsletter-form";
import ProductVisual from "@/components/product-visual";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return { ...pageMetadata({ locale, title: t.meta.title, description: t.meta.description, path: "/" }), title: { absolute: t.meta.title } };
}

const instagramPosts = ["29", "08", "06", "33", "37", "10", "16", "27", "36", "07", "12", "30", "34", "09"];
const heroSlugs = ["extra-virgin-olive-oil", "pomegranate-molasses", "japanese-matcha", "strawberry-syrup", "chilli-hot-sauce"];
const promiseIcons = [PiSealCheckBold, PiFlaskBold, PiPlantBold, PiLeafBold];
const promiseColors = ["bg-leaf", "bg-tomato", "bg-teal", "bg-berry"];

export default async function HomePage() {
  const { t, href, locale } = await getI18n();
  const { products, categories, locations, settings, partners } = await getStorefront();
  const Arrow = locale === "ar" ? PiArrowLeftBold : PiArrowRightBold;

  const cards = products.map(toCardProduct);
  const featured = cards.filter((_, i) => products[i].featured);
  const keto = products.filter((p) => p.badges.includes("keto") && p.images[0]).slice(0, 3);
  const trio = products.find((p) => p.slug === "jadeer-trio");
  const heroProducts = heroSlugs.map((slug) => products.find((p) => p.slug === slug)).filter((p) => p && p.images[0]);

  const tabs = [
    { key: "featured", label: t.home.bestsellers, products: featured.length ? featured : cards },
    ...categories
      .filter((c) => c.productCount > 0)
      .map((category) => ({ key: category.slug, label: category.name, products: cards.filter((_, i) => products[i].categoryId === category.id) })),
  ];

  return (
    <>
      {/* HERO — React Bits Aurora + BlurText + CardSwap */}
      <section className="grain relative overflow-hidden bg-forest text-cream">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(80%_60%_at_80%_10%,rgba(243,180,60,.25),transparent_60%),radial-gradient(60%_50%_at_10%_90%,rgba(246,196,206,.18),transparent_60%)]" />
        <Aurora colorStops={["#a8cc4a", "#f3b43c", "#e0592a"]} amplitude={1.1} blend={0.6} speed={0.5} className="opacity-60" />
        <div className="container-x relative grid items-center gap-10 pb-16 pt-10 md:pt-16 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[1.1fr_1fr] lg:gap-6 lg:pb-20">
          <div>
            <p className="eyebrow text-sun">
              <span className="h-px w-8 bg-sun" /> <span className="shiny-text">{t.home.eyebrow}</span>
            </p>
            <BlurText
              as="h1"
              className="display-xl mt-6 text-cream"
              parts={[{ text: t.home.title1 }, { text: t.home.title2, className: "serif-italic gradient-text" }, { text: t.home.title3 }]}
            />
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/80">{t.home.intro}</p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Magnet strength={0.15}>
                <StarBorder color="#ffffff">
                  <Link href={href("/shop")} className="btn btn-sun px-7 text-base">
                    {t.home.ctaShop} <Arrow aria-hidden="true" />
                  </Link>
                </StarBorder>
              </Magnet>
              <Link href={href("/stores")} className="btn btn-outline-light px-6">
                <PiMapPinFill aria-hidden="true" /> {t.home.ctaStores}
              </Link>
            </div>

            <dl className="mt-11 grid max-w-md grid-cols-3 gap-3">
              {[
                { node: <CountUp to={38.7} decimals={1} suffix="K" />, label: t.home.statCommunity },
                { node: <CountUp to={products.length} suffix="+" />, label: t.home.statProducts },
                { node: <CountUp to={locations.length || 2} />, label: t.home.statStores },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <dt className="text-xs font-bold text-cream/60">{stat.label}</dt>
                  <dd className="font-display text-3xl text-sun" dir="ltr">{stat.node}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto mt-6 grid h-[360px] w-full max-w-[520px] place-items-center sm:h-[440px] lg:mt-0 lg:h-[560px]">
            <div className="scale-[0.78] sm:scale-90 lg:scale-100">
              <CardSwap width={300} height={380} distanceX={40} distanceY={46} delay={4000}>
                {heroProducts.map((product) => (
                  <Link key={product!.id} href={href(`/products/${product!.slug}`)} className="relative block h-full w-full" style={{ background: product!.art.background }} tabIndex={-1}>
                    <ProductVisual image={product!.images[0]?.path} alt={product!.name} art={product!.art} sizes="300px" priority />
                    <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-2xl bg-white/95 px-4 py-3 text-ink shadow-soft">
                      <span className="truncate font-bold">{product!.name}</span>
                      <span className="shrink-0 font-display text-lg text-leaf">{shortMoney(Math.min(...product!.variants.map((v) => v.price)))}</span>
                    </span>
                  </Link>
                ))}
              </CardSwap>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <section aria-hidden="true" className="bg-sun py-4 text-forest">
        <Marquee duration={45}>
          {t.home.ticker.map((item) => (
            <span key={item} className="flex items-center gap-6 px-6 font-display text-3xl serif-italic md:text-4xl">
              {item} <PiLeafBold className="text-tomato" size={22} />
            </span>
          ))}
        </Marquee>
      </section>

      {/* CATEGORIES — colourful tiles */}
      <section aria-labelledby="categories-title" className="container-x mt-20 md:mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t.home.collection}</p>
            <h2 id="categories-title" className="display-lg mt-3">{t.home.categoriesTitle}</h2>
          </div>
          <Link href={href("/shop")} className="group flex min-h-11 items-center gap-2 text-sm font-bold text-leaf">
            {t.common.viewAll} <Arrow className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true" />
          </Link>
        </div>
        <Reveal stagger={0.06} className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {categories.map((category, i) => {
            const src = imageUrl(category.image);
            return (
              <Link
                key={category.slug}
                href={href(`/category/${category.slug}`)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl p-4 text-white md:p-5 ${i === 0 ? "md:col-span-2 md:row-span-2 md:min-h-[440px]" : "min-h-[200px] md:min-h-[210px]"}`}
                style={{ background: category.color }}
              >
                {src && (
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes={i === 0 ? "(min-width: 768px) 50vw, 50vw" : "(min-width: 768px) 25vw, 50vw"}
                    className="object-cover opacity-45 mix-blend-luminosity transition-all duration-700 group-hover:scale-105 group-hover:opacity-70 group-hover:mix-blend-normal"
                  />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" aria-hidden="true" />
                <span className="relative grid size-11 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm md:size-12">
                  <CategoryIcon slug={category.slug} size={24} />
                </span>
                <span className="relative">
                  <span className={`block font-display leading-tight ${i === 0 ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"}`}>{category.name}</span>
                  <span className="mt-1 flex items-center gap-1 text-sm text-white/80">
                    {t.shop.categoryProducts(category.productCount)} <Arrow size={13} aria-hidden="true" />
                  </span>
                </span>
              </Link>
            );
          })}
          <Link href={href("/shop")} className="group flex min-h-[200px] flex-col justify-between rounded-3xl bg-ink p-4 text-cream md:min-h-[210px] md:p-5">
            <PiLeafBold size={26} className="text-lime" aria-hidden="true" />
            <span>
              <span className="block font-display text-xl md:text-2xl">{t.nav.fullPantry}</span>
              <span className="mt-1 flex items-center gap-1 text-sm text-cream/70">
                {t.common.shopAll} <Arrow size={13} className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true" />
              </span>
            </span>
          </Link>
        </Reveal>
      </section>

      {/* BESTSELLERS */}
      <section aria-labelledby="bestsellers-title" className="container-x mt-24 md:mt-28">
        <p className="eyebrow">{t.home.favouritesEyebrow}</p>
        <h2 id="bestsellers-title" className="display-lg mt-3">{t.home.favouritesTitle}</h2>
        <div className="mt-7">
          <FeaturedTabs tabs={tabs} lowStockThreshold={settings.low_stock_threshold} />
        </div>
      </section>

      {/* KETO + GIFT */}
      <section className="container-x mt-24 grid gap-4 md:mt-28 lg:grid-cols-2 lg:gap-5">
        <Reveal className="grain relative overflow-hidden rounded-[2rem] bg-teal p-7 text-white md:p-11">
          <div aria-hidden="true" className="absolute -end-16 -top-16 size-56 rounded-full bg-lime/25 blur-2xl" />
          <p className="eyebrow relative text-lime">{t.home.ketoEyebrow}</p>
          <h2 className="relative mt-3 font-display text-4xl md:text-5xl">{t.home.ketoTitle}</h2>
          <p className="relative mt-3 max-w-sm text-white/80">{t.home.ketoText}</p>
          <div className="relative mt-7 grid grid-cols-3 gap-2.5">
            {keto.map((product) => (
              <Link key={product.id} href={href(`/products/${product.slug}`)} className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-2 ring-white/20" aria-label={product.name}>
                <ProductVisual image={product.images[0]?.path} alt={product.name} art={product.art} sizes="160px" className="transition-transform duration-700 group-hover:scale-105" />
              </Link>
            ))}
          </div>
          <Link href={href("/category/keto")} className="btn btn-light relative mt-7">
            {t.home.ketoCta} <Arrow aria-hidden="true" />
          </Link>
        </Reveal>

        <Reveal className="grain relative grid overflow-hidden rounded-[2rem] bg-berry text-white md:grid-cols-[1fr_0.95fr]">
          <div aria-hidden="true" className="absolute -bottom-20 -start-10 size-64 rounded-full bg-pink/25 blur-2xl" />
          <div className="relative flex flex-col p-7 md:p-11">
            <p className="eyebrow text-pink">{t.home.giftEyebrow}</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">{t.home.giftTitle}</h2>
            <p className="mt-3 text-white/80">{t.home.giftText}</p>
            {trio && <p className="mt-5 font-display text-3xl text-sun" dir="ltr">{shortMoney(trio.variants[0].price)}</p>}
            <Link href={href(trio ? `/products/${trio.slug}` : "/shop")} className="btn btn-sun mt-7 self-start md:mt-auto">
              {t.home.giftCta} <Arrow aria-hidden="true" />
            </Link>
          </div>
          {trio && (
            <div className="relative min-h-72 md:min-h-full">
              <ProductVisual image={trio.images[0]?.path} alt={trio.name} art={trio.art} sizes="(min-width: 1024px) 22vw, 90vw" />
            </div>
          )}
        </Reveal>
      </section>

      {/* PROMISE — on butter yellow */}
      <section aria-labelledby="promise-title" className="mt-24 bg-butter py-20 md:mt-28 md:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <p className="eyebrow">{t.home.promiseEyebrow}</p>
            <h2 id="promise-title" className="display-lg mt-3">
              {t.home.promiseTitle1} <span className="serif-italic text-tomato">{t.home.promiseTitle2}</span>
            </h2>
            <p className="mt-4 max-w-sm text-ink-soft">{t.home.promiseText}</p>
          </div>
          <Reveal stagger={0.08} className="grid gap-3 sm:grid-cols-2">
            {t.home.promises.map(({ title, text }, i) => {
              const Icon = promiseIcons[i];
              return (
                <SpotlightCard key={title} color="rgb(243 180 60 / 0.35)" className="rounded-3xl bg-paper p-7 shadow-soft">
                  <span className={`grid size-12 place-items-center rounded-2xl text-white ${promiseColors[i]}`}>
                    <Icon size={24} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-2xl">{title}</h3>
                  <p className="mt-2 text-ink-soft">{text}</p>
                </SpotlightCard>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* SYRUP STORY — on blush */}
      <section className="bg-blush py-20 md:py-24">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="grid grid-cols-2 gap-3">
            {["06", "09", "37", "32"].map((file, i) => (
              <div key={file} className={`relative aspect-[4/5] overflow-hidden rounded-3xl shadow-soft ${i % 2 ? "translate-y-6" : ""}`}>
                <Image src={`/instagram/post-${file}.webp`} alt="" fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-cover" />
              </div>
            ))}
          </div>
          <Reveal>
            <p className="eyebrow text-berry">{t.home.storyEyebrow}</p>
            <h2 className="display-lg mt-3 text-berry">{t.home.storyTitle}</h2>
            <p className="mt-5 max-w-md text-lg text-ink-soft">{t.home.storyText}</p>
            <ul className="mt-7 grid gap-3">
              {t.home.storyPoints.map((item) => (
                <li key={item} className="flex items-center gap-3 font-bold">
                  <span className="grid size-7 place-items-center rounded-full bg-berry text-white">
                    <PiSealCheckBold size={15} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href={href("/category/natural-syrups")} className="btn btn-primary mt-9">
              {t.home.storyCta} <Arrow aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* JOURNAL */}
      <section aria-labelledby="journal-title" className="container-x mt-24 md:mt-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t.home.journalEyebrow}</p>
            <h2 id="journal-title" className="display-lg mt-3">{t.home.journalTitle}</h2>
          </div>
          <Link href={href("/journal")} className="btn btn-ghost">
            {t.home.journalCta} <Arrow aria-hidden="true" />
          </Link>
        </div>
        <Reveal stagger={0.08} className="mt-9 grid gap-5 md:grid-cols-3">
          {RECIPES.slice(0, 3).map((recipe) => {
            const text = recipeText(recipe, locale);
            return (
              <Link key={recipe.slug} href={href(`/journal/${recipe.slug}`)} className="group block">
                <span className="relative block aspect-[4/3] overflow-hidden rounded-3xl" style={{ background: recipe.color }}>
                  <Image src={recipe.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute start-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-bold">
                    <PiTimerBold aria-hidden="true" /> {t.journal.minutes(recipe.minutes)}
                  </span>
                </span>
                <span className="mt-4 block font-display text-2xl leading-tight group-hover:text-tomato">{text.title}</span>
                <span className="mt-2 line-clamp-2 block text-ink-soft">{text.intro}</span>
              </Link>
            );
          })}
        </Reveal>
      </section>

      {/* INSTAGRAM */}
      <section aria-labelledby="instagram-title" className="mt-24 md:mt-28">
        <div className="container-x flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow"><PiInstagramLogoBold size={15} aria-hidden="true" /> @jadeer.organics</p>
            <h2 id="instagram-title" className="display-lg mt-3">{t.home.instagramTitle}</h2>
          </div>
          <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="btn btn-soft">
            {t.home.instagramCta} <PiArrowUpRightBold aria-hidden="true" />
          </a>
        </div>
        <Marquee duration={70} pauseOnHover className="mt-9">
          {instagramPosts.map((file) => (
            <a key={file} href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="group relative mx-2 block aspect-[4/5] w-44 shrink-0 overflow-hidden rounded-3xl md:w-56" aria-label={t.common.instagram}>
              <Image src={`/instagram/post-${file}.webp`} alt="" fill sizes="224px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </a>
          ))}
        </Marquee>
      </section>

      {/* STORES — on mint */}
      <section aria-labelledby="stores-title" className="mt-24 bg-mint py-20 md:mt-28 md:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <p className="eyebrow text-leaf">{t.home.storesEyebrow}</p>
            <h2 id="stores-title" className="display-lg mt-3">{t.home.storesTitle}</h2>
            <p className="mt-4 text-ink-soft">{t.home.storesText}</p>
            <Link href={href("/stores")} className="btn btn-primary mt-7">
              {t.home.storesCta} <Arrow aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-5">
            {locations.map((location, i) => (
              <article key={location.id} className="group overflow-hidden rounded-3xl bg-paper shadow-soft">
                <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className="relative block aspect-[16/10] overflow-hidden" aria-label={`${t.common.openInMaps}: ${location.name}`}>
                  <Image src={i === 0 ? "/instagram/post-33.webp" : "/instagram/post-30.webp"} alt="" fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute start-3 top-3 grid size-10 place-items-center rounded-full bg-tomato text-white shadow-soft">
                    <PiMapPinFill size={20} aria-hidden="true" />
                  </span>
                </a>
                <div className="p-5">
                  <h3 className="text-2xl">{location.area || location.name}</h3>
                  {location.hours && (
                    <p className="mt-1.5 flex items-start gap-2 text-sm text-ink-soft">
                      <PiClockBold className="mt-0.5 shrink-0" aria-hidden="true" /> {location.hours}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                      <PiMapPinFill aria-hidden="true" /> {t.common.openInMaps}
                    </a>
                    <a href={googleDirectionsUrl(location)} target="_blank" rel="noopener noreferrer" className="btn btn-soft btn-sm">
                      <PiNavigationArrowBold aria-hidden="true" /> {t.common.directions}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      {partners.length > 0 && (
        <section aria-labelledby="partners-title" className="container-x mt-20 text-center">
          <h2 id="partners-title" className="eyebrow justify-center text-ink-soft">{t.home.partners}</h2>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {partners.map((partner) => (
              <li key={partner.id} className="font-display text-2xl text-ink/60" dir="ltr">
                {partner.url ? <a href={partner.url} target="_blank" rel="noopener noreferrer" className="hover:text-ink">{partner.name}</a> : partner.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* NEWSLETTER — tangerine band */}
      <section className="container-x mt-20">
        <div className="grain relative overflow-hidden rounded-[2rem] bg-tomato px-6 py-12 text-white md:px-14 md:py-16">
          <div aria-hidden="true" className="absolute -end-20 -top-24 size-72 rounded-full bg-sun/40 blur-2xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="display-lg">{t.home.newsletterTitle}</h2>
              <p className="mt-3 max-w-md text-white/85">{t.home.newsletterText}</p>
            </div>
            <NewsletterForm tone="light" />
          </div>
        </div>
      </section>
    </>
  );
}
