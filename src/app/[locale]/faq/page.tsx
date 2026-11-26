import type { Metadata } from "next";
import Link from "next/link";
import { PiQuestionBold } from "react-icons/pi";
import { getI18n } from "@/lib/i18n/server";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return pageMetadata({ locale, title: t.faq.metaTitle, description: t.faq.metaDescription, path: "/faq" });
}

const dots = ["bg-leaf", "bg-tomato", "bg-sun", "bg-berry", "bg-teal"];

export default async function FaqPage() {
  const { t, href } = await getI18n();
  return (
    <div className="container-x max-w-3xl pt-8 md:pt-14">
      <JsonLd data={faqJsonLd(t.faq.items)} />
      <p className="eyebrow"><PiQuestionBold aria-hidden="true" /> {t.faq.eyebrow}</p>
      <h1 className="display-xl mt-3">{t.faq.title}</h1>
      <div className="mt-10 grid gap-3">
        {t.faq.items.map((faq, i) => (
          <details key={faq.q} className="group rounded-3xl bg-paper px-5 shadow-soft open:shadow-pop" open={i === 0}>
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-bold [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                <span className={`size-2.5 shrink-0 rounded-full ${dots[i % dots.length]}`} aria-hidden="true" />
                {faq.q}
              </span>
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-xl transition-transform duration-300 group-open:rotate-45">+</span>
            </summary>
            <p className="max-w-2xl pb-6 leading-relaxed text-ink-soft">{faq.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-10 text-center text-ink-soft">
        {t.faq.still} <Link href={href("/contact")} className="font-bold text-leaf underline">{t.faq.contact}</Link>
      </p>
    </div>
  );
}
