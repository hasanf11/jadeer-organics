import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  PiArrowRightBold,
  PiArrowUpRightBold,
  PiInstagramLogoBold,
  PiMapPinFill,
  PiNavigationArrowBold,
  PiClockBold,
} from "react-icons/pi";
import { getStorefront, toCardProduct } from "@/lib/catalog";
import { googleDirectionsUrl, googleMapsUrl } from "@/lib/maps";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import RotatingText from "@/components/motion/rotating-text";
import Magnet from "@/components/motion/magnet";
import CountUp from "@/components/motion/count-up";
import CircularText from "@/components/motion/circular-text";
import ScrollVelocity from "@/components/motion/scroll-velocity";
import SpotlightCard from "@/components/motion/spotlight-card";
import Reveal from "@/components/motion/reveal";
import CurvedLoop from "@/components/motion/curved-loop";
import TiltedCard from "@/components/motion/tilted-card";
import FeaturedTabs from "@/components/store/featured-tabs";
import ProductVisual from "@/components/product-visual";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — Organic food & natural living in Lebanon | جدير` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const heroPosts = [
  { src: "/instagram/post-04.webp", alt: "Ja'deer balsamic vinegar being drizzled", rotate: -6, className: "left-[2%] top-[6%] w-[44%]" },
  { src: "/instagram/post-05.webp", alt: "Ja'deer chilli hot sauce", rotate: 5, className: "right-[2%] top-0 w-[42%]" },
  { src: "/instagram/post-01.webp", alt: "Ja'deer organic Japanese matcha", rotate: 4, className: "left-[8%] bottom-[2%] w-[40%]" },
  { src: "/instagram/post-32.webp", alt: "Ja'deer strawberry syrup", rotate: -4, className: "right-[6%] bottom-[6%] w-[44%]" },
];

const instagramPosts = ["29", "08", "06", "33", "37", "10", "16", "27", "36", "07", "12", "30", "34", "09"];

const promises = [
  { emoji: "🌱", title: "Certified organic", text: "Ingredients grown without synthetic fertilisers or chemicals.", color: "#e3f4d8", spot: "rgb(47 143 58 / 0.25)" },
  { emoji: "🚫", title: "Zero preservatives", text: "No preservatives, colourings or artificial flavourings. Ever.", color: "#ffe6d5", spot: "rgb(239 79 35 / 0.25)" },
  { emoji: "🐝", title: "Pesticide-free", text: "Clean farming that is kind to you and to the land.", color: "#fff0b8", spot: "rgb(255 201 60 / 0.45)" },
  { emoji: "🇱🇧", title: "Proudly Lebanese", text: "Made with Lebanese farmers and traditional family recipes.", color: "#fde8ef", spot: "rgb(210 63 124 / 0.25)" },
];

export default async function HomePage() {
  const store = await getStorefront();
  const { products, categories, locations, settings, partners } = store;

  const cards = products.map(toCardProduct);
  const featured = cards.filter((_, i) => products[i].featured);
  const keto = products.filter((p) => p.badges.includes("keto")).slice(0, 4);
  const trio = products.find((p) => p.slug === "jadeer-trio");

  const tabs = [
    { key: "featured", label: "Bestsellers", emoji: "⭐", products: featured.length ? featured : cards },
    ...categories
      .filter((c) => c.productCount > 0)
      .map((category) => ({
        key: category.slug,
        label: category.name,
        emoji: category.emoji,
        products: cards.filter((_, i) => products[i].categoryId === category.id),
      })),
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-mint blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-32 size-[28rem] rounded-full bg-pink/70 blur-3xl" />

        <div className="container-x relative grid items-center gap-10 pb-16 pt-8 md:pt-12 lg:grid-cols-[1.08fr_1fr] lg:gap-6 lg:pb-24">
          <div>
            <p className="eyebrow">
              <span className="inline-block size-2 animate-pulse rounded-full bg-leaf" /> By Rasha Yassine · Lebanon
            </p>
            <h1 className="display-xl mt-4">
              <span className="block">Real food</span>
              <span className="block">that&apos;s</span>
              <RotatingText
                className="mt-2 text-[0.82em]"
                texts={[
                  { text: "Organic", className: "bg-leaf text-white" },
                  { text: "Natural", className: "bg-tomato text-white" },
                  { text: "Lebanese", className: "bg-sun text-ink" },
                  { text: "Pure", className: "bg-teal text-white" },
                  { text: "Honest", className: "bg-berry text-white" },
                ]}
              />
            </h1>
            <p className="arabic mt-5 text-2xl text-brown md:text-3xl" dir="rtl" lang="ar">
              أنت جدير بهذا النمط من الحياة 🦌
            </p>
            <p className="mt-3 max-w-xl text-lg text-ink-soft">
              Cold-pressed olive oil, real pomegranate molasses, clean ketchup, traditional syrups and organic
              body care — delivered to your door all over Lebanon. Pay cash on delivery.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Magnet>
                <Link href="/shop" className="btn btn-primary px-7 text-lg">
                  Shop now <PiArrowRightBold />
                </Link>
              </Magnet>
              <Link href="/stores" className="btn btn-ghost px-6 text-lg">
                <PiMapPinFill className="text-tomato" /> Find a store
              </Link>
            </div>

            <dl className="mt-9 grid max-w-md grid-cols-3 gap-3">
              {[
                { value: 38700, suffix: "+", label: "Instagram family", display: "38.7K" },
                { value: products.length, suffix: "+", label: "Clean products" },
                { value: locations.length || 2, suffix: "", label: "Shops in Lebanon" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse rounded-2xl bg-white/80 p-3 text-center shadow-soft">
                  <dt className="text-xs font-semibold text-ink-soft">{stat.label}</dt>
                  <dd className="font-display text-2xl font-extrabold text-leaf">
                    {stat.display ? (
                      <CountUp to={38.7} decimals={1} suffix="K" />
                    ) : (
                      <CountUp to={stat.value} suffix={stat.suffix} />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[560px]">
            <div aria-hidden="true" className="absolute inset-[12%] rounded-full bg-sun/80" />
            <div aria-hidden="true" className="absolute inset-[22%] rounded-full border-[3px] border-dashed border-white" />
            {heroPosts.map((post, i) => (
              <div
                key={post.src}
                className={`absolute ${post.className} animate-float`}
                style={{ ["--r" as string]: `${post.rotate}deg`, animationDelay: `${i * -1.4}s` }}
              >
                <TiltedCard max={14}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border-[5px] border-white shadow-pop">
                    <Image src={post.src} alt={post.alt} fill sizes="(min-width: 1024px) 240px, 42vw" priority={i < 2} className="object-cover" />
                  </div>
                </TiltedCard>
              </div>
            ))}
            <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
              <CircularText text="100% organic ✦ 100% natural ✦ ja'deer ✦ " size={150} className="bg-brown text-cream shadow-pop">
                <Image src="/brand/logo-source.png" alt="" width={86} height={86} className="rounded-full" />
              </CircularText>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY HIGHLIGHTS — like the Instagram story circles */}
      <section aria-labelledby="categories-title" className="container-x">
        <div className="flex items-end justify-between gap-4">
          <h2 id="categories-title" className="display-lg">
            Shop by <span className="text-leaf">craving</span>
          </h2>
          <Link href="/shop" className="hidden font-bold text-leaf hover:underline sm:block">
            All products →
          </Link>
        </div>
        <Reveal stagger={0.06} className="scrollbar-none -mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-7 md:overflow-visible md:px-0">
          {categories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="group flex w-24 shrink-0 flex-col items-center text-center md:w-auto">
              <span
                className="grid size-24 place-items-center rounded-full p-[3px] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-6 md:size-28"
                style={{ background: `conic-gradient(${category.color}, #ffc93c, #ef4f23, ${category.color})` }}
              >
                <span className="grid size-full place-items-center rounded-full border-4 border-cream text-4xl md:text-5xl" style={{ background: `${category.color}26` }}>
                  {category.emoji}
                </span>
              </span>
              <span className="mt-2 text-sm font-bold leading-tight">{category.name}</span>
              <span className="text-xs text-ink-soft">{category.productCount} items</span>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* VELOCITY MARQUEE */}
      <section aria-hidden="true" className="my-14 -rotate-2 bg-tomato py-4 text-cream shadow-pop md:my-20">
        <ScrollVelocity
          items={["Olive oil", "Pomegranate molasses", "Healthy ketchup", "Jallab", "Matcha", "Date tahini", "Keto"]}
          speed={60}
          itemClassName="font-display text-4xl font-extrabold uppercase md:text-6xl"
          separator="🌿"
        />
      </section>

      {/* BESTSELLERS */}
      <section aria-labelledby="bestsellers-title" className="container-x">
        <p className="eyebrow">Loved across Lebanon</p>
        <h2 id="bestsellers-title" className="display-lg mt-2 max-w-2xl">
          Clean pantry favourites
        </h2>
        <div className="mt-6">
          <FeaturedTabs tabs={tabs} lowStockThreshold={settings.low_stock_threshold} />
        </div>
      </section>

      {/* KETO + GIFT BANNERS */}
      <section className="container-x mt-20 grid gap-5 lg:grid-cols-2">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-teal p-7 text-white md:p-10">
          <div aria-hidden="true" className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10" />
          <p className="arabic text-xl text-sun" dir="rtl" lang="ar">منتجات الكيتو</p>
          <h2 className="mt-1 font-display text-5xl font-extrabold uppercase md:text-6xl">Keto corner</h2>
          <p className="mt-2 max-w-sm text-white/85">All the taste, none of the sugar. Keto ketchup, BBQ sauce, rose syrup and more.</p>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {keto.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl border-2 border-white/40" aria-label={product.name}>
                <ProductVisual image={product.images[0]?.path} alt={product.name} art={product.art} sizes="120px" className="transition-transform duration-500 group-hover:scale-110" />
              </Link>
            ))}
          </div>
          <Link href="/category/keto" className="btn mt-6 bg-white text-teal hover:bg-sun hover:text-ink">
            Explore keto <PiArrowRightBold />
          </Link>
        </Reveal>

        <Reveal className="bg-gingham relative overflow-hidden rounded-[2rem] p-3">
          <div className="grid h-full gap-4 rounded-[1.6rem] bg-cream/95 p-7 md:grid-cols-[1fr_auto] md:p-9">
            <div>
              <p className="eyebrow text-tomato">The perfect gift</p>
              <h2 className="mt-2 font-display text-4xl font-extrabold md:text-5xl">The Ja&apos;deer Trio 🎁</h2>
              <p className="mt-3 max-w-sm text-ink-soft">
                Olive oil, pomegranate molasses and balsamic vinegar in one beautiful set — for anyone who
                loves real Lebanese flavour.
              </p>
              <Link href={trio ? `/products/${trio.slug}` : "/shop"} className="btn btn-tomato mt-6">
                Gift it now <PiArrowRightBold />
              </Link>
            </div>
            {trio && (
              <div className="relative mx-auto aspect-[4/5] w-48 rotate-3 overflow-hidden rounded-3xl border-[6px] border-white shadow-pop md:w-56">
                <ProductVisual image={trio.images[0]?.path} alt={trio.name} art={trio.art} sizes="224px" />
              </div>
            )}
          </div>
        </Reveal>
      </section>

      {/* PROMISES */}
      <section aria-labelledby="promise-title" className="container-x mt-24">
        <div className="text-center">
          <p className="eyebrow justify-center">The Ja&apos;deer promise</p>
          <h2 id="promise-title" className="display-lg mx-auto mt-2 max-w-3xl">
            Your health is our <span className="relative inline-block text-leaf">mission<svg aria-hidden="true" viewBox="0 0 200 12" className="absolute -bottom-2 left-0 w-full"><path d="M2 9C50 2 150 2 198 8" stroke="#ffc93c" strokeWidth="5" fill="none" strokeLinecap="round" /></svg></span>
          </h2>
        </div>
        <Reveal stagger={0.1} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map((promise) => (
            <SpotlightCard key={promise.title} color={promise.spot} className="rounded-[1.8rem] p-6" style={{ background: promise.color }}>
              <span className="grid size-16 place-items-center rounded-2xl bg-white text-4xl shadow-soft">{promise.emoji}</span>
              <h3 className="mt-5 text-2xl">{promise.title}</h3>
              <p className="mt-2 text-ink-soft">{promise.text}</p>
            </SpotlightCard>
          ))}
        </Reveal>
      </section>

      {/* INGREDIENT STORY */}
      <section className="container-x mt-24">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2.2rem] bg-[#5aa832] p-6 text-white md:grid-cols-2 md:p-12">
          <Reveal>
            <p className="font-bold uppercase tracking-[0.2em] text-butter">Read the label</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold uppercase leading-[0.95] md:text-6xl">
              What&apos;s really inside your syrup?
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/90">
              Most supermarket syrups are colouring, flavouring and corn syrup. Ours are made from real fruit,
              flowers and dates — the way Lebanese grandmothers made them.
            </p>
            <ul className="mt-6 grid gap-2 font-bold">
              {["Real fruit, flowers & dates", "No colourings or flavourings", "Sugar-free keto options"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full bg-butter text-sm text-[#2f6a12]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/category/natural-syrups" className="btn mt-7 bg-white text-[#2f6a12] hover:bg-butter">
              Shop syrups <PiArrowRightBold />
            </Link>
          </Reveal>
          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-3">
            {["06", "09", "37", "32"].map((file, i) => (
              <div key={file} className={`relative aspect-[4/5] overflow-hidden rounded-3xl border-4 border-white/70 shadow-pop ${i % 2 ? "translate-y-8" : ""}`}>
                <Image src={`/instagram/post-${file}.webp`} alt="Ja'deer natural syrup" fill sizes="(min-width: 768px) 220px, 45vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section aria-labelledby="instagram-title" className="mt-24 overflow-hidden">
        <div className="container-x flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-berry">
              <PiInstagramLogoBold size={16} /> @jadeer.organics
            </p>
            <h2 id="instagram-title" className="display-lg mt-2">
              Fresh from our feed
            </h2>
          </div>
          <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="btn btn-soft">
            Follow us <PiArrowUpRightBold />
          </a>
        </div>
        <div className="mt-8 flex animate-marquee gap-4 hover:[animation-play-state:paused]" style={{ width: "max-content" }}>
          {[...instagramPosts, ...instagramPosts].map((file, i) => (
            <a
              key={`${file}-${i}`}
              href={settings.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={i >= instagramPosts.length ? -1 : undefined}
              aria-hidden={i >= instagramPosts.length ? true : undefined}
              className="group relative block aspect-[4/5] w-44 shrink-0 overflow-hidden rounded-3xl md:w-56"
            >
              <Image src={`/instagram/post-${file}.webp`} alt={i < instagramPosts.length ? "Ja'deer Organics Instagram post" : ""} fill sizes="224px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
              <span className="absolute inset-0 grid place-items-center bg-berry/0 text-white opacity-0 transition-all group-hover:bg-berry/40 group-hover:opacity-100">
                <PiInstagramLogoBold size={36} />
              </span>
            </a>
          ))}
        </div>
        <CurvedLoop text="You deserve this way of life · أنت جدير" className="mt-6 font-display text-[3.2rem] font-extrabold text-leaf" />
      </section>

      {/* STORES */}
      <section aria-labelledby="stores-title" className="container-x mt-16">
        <div className="grid gap-6 rounded-[2.2rem] bg-blush p-6 md:p-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow text-berry">Come say hello</p>
            <h2 id="stores-title" className="display-lg mt-2">Visit our shops</h2>
            <p className="mt-3 text-ink-soft">
              Taste before you buy, discover new arrivals and get advice from our team. Tap a shop to open it
              in Google Maps.
            </p>
            <Link href="/stores" className="btn btn-ink mt-6">
              All store details <PiArrowRightBold />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {locations.map((location, i) => (
              <div key={location.id} className="flex flex-col rounded-[1.6rem] bg-white p-5 shadow-soft">
                <div className="relative -mx-1 -mt-1 mb-4 aspect-[16/9] overflow-hidden rounded-2xl">
                  <Image src={i === 0 ? "/instagram/post-23.webp" : "/instagram/post-21.webp"} alt={location.name} fill sizes="(min-width: 640px) 300px, 90vw" className="object-cover" />
                </div>
                <h3 className="text-xl">{location.area || location.name}</h3>
                {location.name_ar && <p className="arabic text-ink-soft" dir="rtl" lang="ar">{location.name_ar}</p>}
                {location.hours && (
                  <p className="mt-2 flex items-start gap-2 text-sm text-ink-soft">
                    <PiClockBold className="mt-0.5 shrink-0" /> {location.hours}
                  </p>
                )}
                <div className="mt-auto flex gap-2 pt-4">
                  <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm flex-1">
                    <PiMapPinFill /> Open map
                  </a>
                  <a href={googleDirectionsUrl(location)} target="_blank" rel="noopener noreferrer" className="btn btn-soft btn-sm" aria-label={`Directions to ${location.name}`}>
                    <PiNavigationArrowBold />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      {partners.length > 0 && (
        <section aria-labelledby="partners-title" className="container-x mt-16 text-center">
          <h2 id="partners-title" className="text-sm font-bold uppercase tracking-[0.2em] text-ink-soft">
            Also available at
          </h2>
          <ul className="mt-5 flex flex-wrap justify-center gap-3">
            {partners.map((partner) => (
              <li key={partner.id}>
                {partner.url ? (
                  <a href={partner.url} target="_blank" rel="noopener noreferrer" className="chip border-2 border-line bg-white px-5 py-3 font-display text-lg hover:border-leaf">
                    {partner.name}
                  </a>
                ) : (
                  <span className="chip border-2 border-line bg-white px-5 py-3 font-display text-lg">{partner.name}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
