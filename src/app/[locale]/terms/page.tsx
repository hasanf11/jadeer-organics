import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return pageMetadata({ locale, title: t.terms.metaTitle, description: t.terms.metaDescription, path: "/terms" });
}

export default async function TermsPage() {
  const { t } = await getI18n();
  return (
    <div className="container-x max-w-3xl pt-8 md:pt-14">
      <h1 className="display-lg">{t.terms.title}</h1>
      <div className="prose-jadeer mt-6">
        {t.terms.sections.map((section) => (
          <section key={section.h}>
            <h2>{section.h}</h2>
            <p>{section.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
