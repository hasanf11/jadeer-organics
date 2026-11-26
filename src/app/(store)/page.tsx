import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  PiArrowRightBold,
  PiArrowUpRight,
  PiClock,
  PiFlask,
  PiInstagramLogo,
  PiLeaf,
  PiMapPin,
  PiNavigationArrow,
  PiPlant,
  PiPlusBold,
  PiSealCheck,
} from "react-icons/pi";
import { getStorefront, toCardProduct } from "@/lib/catalog";
import { imageUrl } from "@/lib/images";
import { googleDirectionsUrl, googleMapsUrl } from "@/lib/maps";
import { shortMoney } from "@/lib/format";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import Magnet from "@/components/motion/magnet";
import CountUp from "@/components/motion/count-up";
import ScrollVelocity from "@/components/motion/scroll-velocity";
import SpotlightCard from "@/components/motion/spotlight-card";
import Reveal from "@/components/motion/reveal";
import SplitText from "@/components/motion/split-text";
import TiltedCard from "@/components/motion/tilted-card";
import FeaturedTabs from "@/components/store/featured-tabs";
import ProductVisual from "@/components/product-visual";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — Organic food & natural living in Lebanon | جدير` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const instagramPosts = ["29", "08", "06", "33", "37", "10", "16", "27", "36", "07", "12", "30", "34", "09"];

const promises = [
  { icon: PiSealCheck, title: "Certified organic", text: "Ingredients grown without synthetic fertilisers or chemicals." },
  { icon: PiFlask, title: "Nothing artificial", text: "No preservatives, colourings or artificial flavourings — ever." },
  { icon: PiPlant, title: "Pesticide-free", text: "Clean farming that is kinder to you and to the land." },
  { icon: PiLeaf, title: "Proudly Lebanese", text: "Made with local farmers and time-honoured family recipes." },
];

export default async function HomePage() {
  const store = await getStorefront();
  const { products, categories, locations, settings, partners } = store;

  const cards = products.map(toCardProduct);
  const featured = cards.filter((_, i) => products[i].featured);
  const keto = products.filter((p) => p.badges.includes("keto") && p.images[0]).slice(0, 3);
  const trio = products.find((p) => p.slug === "jadeer-trio");
  const oil = products.find((p) => p.slug === "extra-virgin-olive-oil");

  const tabs = [
    { key: "featured", label: "Bestsellers", products: featured.length ? featured : cards },
    ...categories
      .filter((c) => c.productCount > 0)
      .map((category) => ({
        key: category.slug,
        label: category.name,
        products: cards.filter((_, i) => products[i].categoryId === category.id),
      })),
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-12 pb-20 pt-10 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28">
          <div>
            <p className="eyebrow">
              <span className="h-px w-8 bg-leaf" /> Organic pantry · Lebanon
            </p>
            <SplitText as="h1" className="display-xl mt-6" splitType="words" stagger={0.05}>
              Honest food, <span className="serif-italic text-leaf">grown &amp; made</span> in Lebanon.
            </SplitText>
            <p className="arabic mt-5 text-xl text-brown/80" dir="rtl" lang="ar">
              أنت جدير بهذا النمط من الحياة
            </p>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
              Cold-pressed olive oil, pure pomegranate molasses, clean sauces, traditional syrups and organic body care
              — free from preservatives and pesticides, delivered to your door with cash on delivery.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Magnet strength={0.18}>
                <Link href="/shop" className="btn btn-primary px-7">
                  Shop the pantry <PiArrowRightBold />
                </Link>
              </Magnet>
              <Link href="/stores" className="btn btn-ghost px-6">
                Visit our stores
              </Link>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 divide-x divide-line border-y border-line">
              {[
                { node: <CountUp to={38.7} decimals={1} suffix="K" />, label: "Community" },
                { node: <CountUp to={products.length} suffix="+" />, label: "Products" },
                { node: <CountUp to={locations.length || 2} />, label: "Stores" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse px-4 py-4 first:pl-0">
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{stat.label}</dt>
                  <dd className="font-display text-3xl">{stat.node}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative grid grid-cols-[1.15fr_1fr] gap-3 md:gap-4">
            <TiltedCard max={5} scale={1.01} className="row-span-2">
              <div className="relative h-full min-h-[380px] overflow-hidden rounded-2xl md:min-h-[540px]">
                <Image src="/instagram/post-31.webp" alt="Ja'deer extra virgin olive oil bottles" fill priority sizes="(min-width: 1024px) 28vw, 55vw" className="object-cover" />
              </div>
            </TiltedCard>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
              <Image src="/instagram/post-04.webp" alt="Ja'deer balsamic vinegar being drizzled" fill priority sizes="(min-width: 1024px) 22vw, 45vw" className="object-cover" />
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
              <Image src="/instagram/post-01.webp" alt="Ja'deer organic Japanese matcha" fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-cover" />
            </div>
            {oil && (
              <Link
                href={`/products/${oil.slug}`}
                className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-full bg-paper py-2 pl-2 pr-5 shadow-pop transition-transform hover:-translate-y-0.5 md:left-8"
              >
                <span className="grid size-9 place-items-center rounded-full bg-leaf text-white"><PiPlusBold size={14} /></span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold">{oil.name}</span>
                  <span className="text-xs text-ink-soft">From {shortMoney(Math.min(...oil.variants.map((v) => v.price)))}</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* TICKER */}
      <section aria-hidden="true" className="border-y border-line py-5">
        <ScrollVelocity
          items={["Cold-pressed olive oil", "Pomegranate molasses", "Healthy sauces", "Traditional syrups", "Japanese matcha", "Natural body care"]}
          speed={40}
          itemClassName="serif-italic text-3xl text-ink md:text-4xl"
          separator={<span className="mx-4 inline-block size-1.5 rounded-full bg-sun align-middle" />}
        />
      </section>

      {/* CATEGORIES */}
      <section aria-labelledby="categories-title" className="container-x mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 id="categories-title" className="display-lg mt-3">Shop by category</h2>
          </div>
          <Link href="/shop" className="group flex items-center gap-2 text-sm font-semibold">
            View all products <PiArrowRightBold className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <Reveal stagger={0.06} className="scrollbar-none -mx-5 mt-10 flex snap-x gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-7">
          {categories.map((category) => {
            const src = imageUrl(category.image);
            return (
              <Link key={category.slug} href={`/category/${category.slug}`} className="group w-40 shrink-0 snap-start md:w-auto">
                <span className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-sand">
                  {src && <Image src={src} alt="" fill sizes="(min-width: 1024px) 14vw, (min-width: 768px) 25vw, 160px" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                </span>
                <span className="mt-3 block font-display text-lg leading-tight">{category.name}</span>
                <span className="text-xs text-ink-soft">{category.productCount} products</span>
              </Link>
            );
          })}
        </Reveal>
      </section>

      {/* BESTSELLERS */}
      <section aria-labelledby="bestsellers-title" className="container-x mt-28">
        <div className="max-w-2xl">
          <p className="eyebrow">Loved across Lebanon</p>
          <h2 id="bestsellers-title" className="display-lg mt-3">Pantry favourites</h2>
        </div>
        <div className="mt-8">
          <FeaturedTabs tabs={tabs} lowStockThreshold={settings.low_stock_threshold} />
        </div>
      </section>

      {/* KETO + GIFT */}
      <section className="container-x mt-28 grid gap-5 lg:grid-cols-2">
        <Reveal className="grain relative overflow-hidden rounded-3xl bg-teal p-8 text-white md:p-12">
          <p className="eyebrow text-white/70">Low carb, full flavour</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">The Keto Corner</h2>
          <p className="mt-3 max-w-sm text-white/80">Keto ketchup, BBQ sauce and sugar-free syrups — sweetened naturally, never with refined sugar.</p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {keto.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-xl" aria-label={product.name}>
                <ProductVisual image={product.images[0]?.path} alt={product.name} art={product.art} sizes="160px" className="transition-transform duration-700 group-hover:scale-105" />
              </Link>
            ))}
          </div>
          <Link href="/category/keto" className="btn mt-8 bg-white text-teal hover:bg-cream">
            Explore keto <PiArrowRightBold />
          </Link>
        </Reveal>

        <Reveal className="relative grid overflow-hidden rounded-3xl bg-sand md:grid-cols-[1fr_0.9fr]">
          <div className="flex flex-col p-8 md:p-12">
            <p className="eyebrow text-tomato">The perfect gift</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">The Ja&apos;deer Trio</h2>
            <p className="mt-3 text-ink-soft">
              Extra virgin olive oil, pomegranate molasses and balsamic vinegar, together in one beautiful set.
            </p>
            {trio && <p className="mt-5 font-display text-2xl">{shortMoney(trio.variants[0].price)}</p>}
            <Link href={trio ? `/products/${trio.slug}` : "/shop"} className="btn btn-ink mt-8 self-start md:mt-auto">
              Discover the set <PiArrowRightBold />
            </Link>
          </div>
          {trio && (
            <div className="relative min-h-72">
              <ProductVisual image={trio.images[0]?.path} alt={trio.name} art={trio.art} sizes="(min-width: 1024px) 22vw, 90vw" />
            </div>
          )}
        </Reveal>
      </section>

      {/* PROMISE */}
      <section aria-labelledby="promise-title" className="container-x mt-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <p className="eyebrow">The Ja&apos;deer promise</p>
            <h2 id="promise-title" className="display-lg mt-3">
              Your health is <span className="serif-italic text-leaf">our mission.</span>
            </h2>
            <p className="mt-4 text-ink-soft">
              Every product on our shelves is chosen the way we would choose it for our own family.
            </p>
          </div>
          <Reveal stagger={0.08} className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
            {promises.map(({ icon: Icon, title, text }) => (
              <SpotlightCard key={title} color="rgb(46 94 53 / 0.08)" className="bg-paper p-8">
                <Icon size={30} className="text-leaf" aria-hidden="true" />
                <h3 className="mt-6 text-2xl">{title}</h3>
                <p className="mt-2 text-ink-soft">{text}</p>
              </SpotlightCard>
            ))}
          </Reveal>
        </div>
      </section>

      {/* STORY */}
      <section className="container-x mt-28">
        <div className="grain grid items-center gap-10 overflow-hidden rounded-3xl bg-leaf text-cream lg:grid-cols-2">
          <div className="relative grid min-h-[420px] grid-cols-2 gap-3 p-3">
            {["06", "09", "37", "32"].map((file) => (
              <div key={file} className="relative overflow-hidden rounded-2xl">
                <Image src={`/instagram/post-${file}.webp`} alt="Ja'deer natural syrup" fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-cover" />
              </div>
            ))}
          </div>
          <Reveal className="p-8 pt-0 md:p-14 lg:pl-4">
            <p className="eyebrow text-sun">Read the label</p>
            <h2 className="display-lg mt-4">What&apos;s really inside your syrup?</h2>
            <p className="mt-5 max-w-md text-lg text-cream/80">
              Most supermarket syrups are colouring, flavouring and corn syrup. Ours are made from real fruit, flowers and
              dates — the way Lebanese families have always made them.
            </p>
            <ul className="mt-7 grid gap-3">
              {["Real fruit, flowers and dates", "No colourings or flavourings", "Sugar-free keto options"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-cream/90">
                  <span className="h-px w-6 bg-sun" /> {item}
                </li>
              ))}
            </ul>
            <Link href="/category/natural-syrups" className="btn mt-9 bg-cream text-ink hover:bg-white">
              Shop syrups <PiArrowRightBold />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section aria-labelledby="instagram-title" className="mt-28 overflow-hidden">
        <div className="container-x flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow"><PiInstagramLogo size={15} /> @jadeer.organics</p>
            <h2 id="instagram-title" className="display-lg mt-3">From our kitchen</h2>
          </div>
          <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="btn btn-soft">
            Follow on Instagram <PiArrowUpRight />
          </a>
        </div>
        <div className="mt-10 flex animate-marquee gap-4 hover:[animation-play-state:paused]" style={{ width: "max-content" }}>
          {[...instagramPosts, ...instagramPosts].map((file, i) => (
            <a
              key={`${file}-${i}`}
              href={settings.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={i >= instagramPosts.length ? -1 : undefined}
              aria-hidden={i >= instagramPosts.length ? true : undefined}
              className="group relative block aspect-[4/5] w-48 shrink-0 overflow-hidden rounded-2xl md:w-60"
            >
              <Image src={`/instagram/post-${file}.webp`} alt={i < instagramPosts.length ? "Ja'deer Organics on Instagram" : ""} fill sizes="240px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </a>
          ))}
        </div>
      </section>

      {/* STORES */}
      <section aria-labelledby="stores-title" className="container-x mt-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <p className="eyebrow">Come and visit</p>
            <h2 id="stores-title" className="display-lg mt-3">Our stores</h2>
            <p className="mt-4 text-ink-soft">
              Taste before you buy, discover new arrivals and get advice from our team. Tap a store to open it in Google Maps.
            </p>
            <Link href="/stores" className="btn btn-ghost mt-7">
              Store details <PiArrowRightBold />
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-5">
            {locations.map((location, i) => (
              <article key={location.id} className="group">
                <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-sand" aria-label={`Open ${location.name} in Google Maps`}>
                  <Image src={i === 0 ? "/instagram/post-33.webp" : "/instagram/post-30.webp"} alt="" fill sizes="(min-width: 640px) 30vw, 90vw" className={`object-cover transition-transform duration-700 group-hover:scale-105`} />
                </a>
                <h3 className="mt-4 text-2xl">{location.area || location.name}</h3>
                {location.hours && (
                  <p className="mt-1 flex items-start gap-2 text-sm text-ink-soft">
                    <PiClock className="mt-0.5 shrink-0" /> {location.hours}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className="btn btn-ink btn-sm">
                    <PiMapPin /> Open in Maps
                  </a>
                  <a href={googleDirectionsUrl(location)} target="_blank" rel="noopener noreferrer" className="btn btn-soft btn-sm">
                    <PiNavigationArrow /> Directions
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      {partners.length > 0 && (
        <section aria-labelledby="partners-title" className="container-x mt-24 border-t border-line pt-12 text-center">
          <h2 id="partners-title" className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-ink-soft">
            Also available at
          </h2>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {partners.map((partner) => (
              <li key={partner.id} className="font-display text-2xl text-ink/70">
                {partner.url ? (
                  <a href={partner.url} target="_blank" rel="noopener noreferrer" className="hover:text-ink">{partner.name}</a>
                ) : (
                  partner.name
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
