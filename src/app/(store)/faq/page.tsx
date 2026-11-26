import Link from "next/link";
import { FAQS } from "@/lib/faqs";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/json-ld";

export const metadata = pageMetadata({
  title: "Frequently asked questions",
  description: "Answers about cash on delivery, delivery areas and fees, organic ingredients, keto products and more at Ja'deer Organics.",
  path: "/faq",
});


export default function FaqPage() {
  return (
    <div className="container-x max-w-3xl pt-8 md:pt-14">
      <JsonLd data={faqJsonLd(FAQS)} />
      <p className="eyebrow">Good questions</p>
      <h1 className="display-xl mt-4">Questions &amp; answers</h1>
      <div className="mt-10 divide-y divide-line border-y border-line">
        {FAQS.map((faq, i) => (
          <details key={faq.q} className="group" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 font-display text-xl [&::-webkit-details-marker]:hidden">
              {faq.q}
              <span aria-hidden="true" className="shrink-0 text-2xl font-light text-ink-soft transition-transform duration-300 group-open:rotate-45">+</span>
            </summary>
            <p className="max-w-2xl pb-6 leading-relaxed text-ink-soft">{faq.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-10 text-center text-ink-soft">
        Still have a question? <Link href="/contact" className="font-bold text-leaf underline">Contact us</Link>.
      </p>
    </div>
  );
}
