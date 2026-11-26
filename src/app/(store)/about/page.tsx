import Image from "next/image";
import Link from "next/link";
import { PiArrowRightBold, PiFlask, PiHeart, PiPlant, PiSealCheck } from "react-icons/pi";
import { pageMetadata } from "@/lib/seo";
import Reveal from "@/components/motion/reveal";
import CountUp from "@/components/motion/count-up";

export const metadata = pageMetadata({
  title: "Our story — by Rasha Yassine",
  description:
    "Ja'deer Organics was founded by Rasha Yassine with one mission: your health. Organic, preservative-free and pesticide-free food and natural living from Lebanon.",
  path: "/about",
});

const values = [
  { title: "Organic", text: "We choose certified organic ingredients and farms that respect the land.", icon: PiSealCheck },
  { title: "Preservative-free", text: "If our grandmothers wouldn't recognise an ingredient, it doesn't go in our jars.", icon: PiFlask },
  { title: "Pesticide-free", text: "Clean farming for clean food — better for you and for nature.", icon: PiPlant },
  { title: "Your health first", text: "Every product is chosen as if it were for our own family.", icon: PiHeart },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-10 py-10 md:py-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Our story</p>
            <h1 className="display-xl mt-4">You deserve <span className="serif-italic text-leaf">this way of life.</span></h1>
            <p className="arabic mt-4 text-2xl text-ink-soft" dir="rtl" lang="ar">أنت جدير بهذا النمط من الحياة</p>
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
              <div key={file} className={`relative aspect-[4/5] overflow-hidden rounded-2xl ${i % 2 ? "translate-y-10" : ""}`}>
                <Image src={`/instagram/post-${file}.webp`} alt="Ja'deer Organics products" fill sizes="(min-width: 1024px) 25vw, 45vw" className="object-cover" priority={i < 2} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x mt-24">
        <p className="eyebrow">What we stand for</p>
        <Reveal stagger={0.1} className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ title, text, icon: Icon }) => (
            <div key={title} className="bg-paper p-8">
              <Icon size={30} className="text-leaf" aria-hidden="true" />
              <h2 className="mt-6 text-2xl">{title}</h2>
              <p className="mt-2 text-ink-soft">{text}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="container-x mt-16">
        <div className="grain grid gap-8 rounded-3xl bg-leaf p-10 text-center text-cream sm:grid-cols-3 md:p-14">
          {[
            { to: 38.7, decimals: 1, suffix: "K", label: "people follow our journey" },
            { to: 35, decimals: 0, suffix: "+", label: "clean products" },
            { to: 100, decimals: 0, suffix: "%", label: "preservative-free" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-6xl text-cream">
                <CountUp to={stat.to} decimals={stat.decimals} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-sm text-cream/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
