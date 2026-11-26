import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import TrackForm from "@/components/store/track-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return pageMetadata({ locale, title: t.track.metaTitle, description: t.track.metaDescription, path: "/track" });
}

export default async function TrackPage() {
  const { t } = await getI18n();
  return (
    <div className="container-x max-w-3xl pt-8 md:pt-14">
      <p className="eyebrow">{t.track.eyebrow}</p>
      <h1 className="display-lg mt-3">{t.track.title}</h1>
      <p className="mt-3 text-ink-soft">{t.track.intro}</p>
      <TrackForm />
    </div>
  );
}
