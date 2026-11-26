import Image from "next/image";
import Link from "next/link";
import { PiArrowRightBold } from "react-icons/pi";
import { pageMetadata } from "@/lib/seo";
import Reveal from "@/components/motion/reveal";
import CountUp from "@/components/motion/count-up";
import ScrollVelocity from "@/components/motion/scroll-velocity";

export const metadata = pageMetadata({
  title: "Our story — by Rasha Yassine",
  description:
    "Ja'deer Organics was founded by Rasha Yassine with one mission: your health. Organic, preservative-free and pesticide-free food and natural living from Lebanon.",
  path: "/about",
});

const values = [
  { title: "Organic", text: "We choose certified organic ingredients and farms that respect the land.", bg: "bg-mint", emoji: "🌱" },
  { title: "Preservatives-free", text: "If grandma wouldn't recognise it, it doesn't go in our jars.", bg: "bg-butter", emoji: "🫙" },
  { title: "Pesticides-free", text: "Clean farming for clean food — better for you and for nature.", bg: "bg-blush", emoji: "🐞" },
  { title: "Your health is our mission", text: "Every product is chosen as if it were for our own family.", bg: "bg-sky", emoji: "💚" },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-10 py-10 md:py-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Our story</p>
            <h1 className="display-xl mt-2">You deserve this way of life</h1>
            <p className="arabic mt-4 text-3xl text-brown" dir="rtl" lang="ar">أنت جدير بهذا النمط من الحياة</p>
            <p className="mt-5 text-lg text-ink-soft">
              <strong className="text-ink">Ja&apos;deer</strong> (جدير) means <em>“deserving”</em>. Rasha Yassine started
              Ja&apos;deer Organics because she believes everyone deserves food that is honest: no preservatives, no
              pesticides, no shortcuts.
            </p>
            <p className="mt-4 text-lg text-ink-soft">
              Today Ja&apos;deer is a family of clean pantry staples, healthy sauces, traditional Lebanese syrups and
              natural body care — with shops in Haret Hreik and Kayfoun, more than 38,000 people following along on
              Instagram, and products stocked by organic markets across Lebanon.
            </p>
            <Link href="/shop" className="btn btn-primary mt-7">
              Taste the difference <PiArrowRightBold />
            </Link>
          </div>
          <div className="relative grid grid-cols-2 gap-4">
            {["19", "29", "36", "07"].map((file, i) => (
              <div key={file} className={`relative aspect-[4/5] overflow-hidden rounded-[1.6rem] border-4 border-white shadow-pop ${i % 2 ? "translate-y-10" : ""} ${i === 0 ? "-rotate-2" : i === 3 ? "rotate-2" : ""}`}>
                <Image src={`/instagram/post-${file}.webp`} alt="Ja'deer Organics products" fill sizes="(min-width: 1024px) 25vw, 45vw" className="object-cover" priority={i < 2} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="my-12 bg-brown py-5 text-cream">
        <ScrollVelocity items={["Organic", "Preservatives-free", "Pesticides-free", "Your health is our mission"]} speed={45} itemClassName="font-display text-3xl font-extrabold uppercase md:text-5xl" separator="🦌" />
      </section>

      <section className="container-x">
        <Reveal stagger={0.1} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <div key={value.title} className={`rounded-[1.8rem] p-6 ${value.bg}`}>
              <span className="text-5xl">{value.emoji}</span>
              <h2 className="mt-4 text-2xl">{value.title}</h2>
              <p className="mt-2 text-ink-soft">{value.text}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="container-x mt-16">
        <div className="grid gap-4 rounded-[2rem] bg-leaf p-8 text-center text-white sm:grid-cols-3 md:p-12">
          {[
            { to: 38.7, decimals: 1, suffix: "K", label: "people follow our journey" },
            { to: 35, decimals: 0, suffix: "+", label: "clean products" },
            { to: 100, decimals: 0, suffix: "%", label: "preservative-free" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-6xl font-extrabold text-butter">
                <CountUp to={stat.to} decimals={stat.decimals} suffix={stat.suffix} />
              </p>
              <p className="mt-1 font-bold text-white/85">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
