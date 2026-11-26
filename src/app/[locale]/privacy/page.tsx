import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return pageMetadata({ locale, title: t.privacy.metaTitle, description: t.privacy.metaDescription, path: "/privacy" });
}

export default async function PrivacyPage() {
  const { t } = await getI18n();
  return (
    <div className="container-x max-w-3xl pt-8 md:pt-14">
      <h1 className="display-lg">{t.privacy.title}</h1>
      <div className="prose-jadeer mt-6">
        <p>{t.privacy.intro}</p>
        {t.privacy.sections.map((section) => (
          <section key={section.h}>
            <h2>{section.h}</h2>
            {"items" in section && section.items ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{"p" in section ? section.p : ""}</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
