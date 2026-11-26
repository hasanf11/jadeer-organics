import Link from "next/link";
import { FAQS } from "@/lib/faqs";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/json-ld";

export const metadata = pageMetadata({
  title: "Frequently asked questions",
  description: "Answers about cash on delivery, delivery areas and fees, organic ingredients, keto products and more at Ja'deer Organics.",
  path: "/faq",
});

const colors = ["bg-mint", "bg-butter", "bg-blush", "bg-sky"];

export default function FaqPage() {
  return (
    <div className="container-x max-w-3xl pt-8 md:pt-14">
      <JsonLd data={faqJsonLd(FAQS)} />
      <p className="eyebrow">Good questions</p>
      <h1 className="display-xl mt-2">FAQ</h1>
      <div className="mt-8 grid gap-3">
        {FAQS.map((faq, i) => (
          <details key={faq.q} className={`group rounded-[1.5rem] px-5 ${colors[i % colors.length]}`} open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-bold [&::-webkit-details-marker]:hidden">
              {faq.q}
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-xl transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="pb-5 text-ink-soft">{faq.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-10 text-center text-ink-soft">
        Still have a question? <Link href="/contact" className="font-bold text-leaf underline">Contact us</Link>.
      </p>
    </div>
  );
}
