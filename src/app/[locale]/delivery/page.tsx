import type { Metadata } from "next";
import { PiTruckBold } from "react-icons/pi";
import { getStorefront } from "@/lib/catalog";
import { money } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return pageMetadata({ locale, title: t.delivery.metaTitle, description: t.delivery.metaDescription, path: "/delivery" });
}

export default async function DeliveryPage() {
  const { t } = await getI18n();
  const { zones, settings } = await getStorefront();
  return (
    <div className="container-x max-w-3xl pt-8 md:pt-14">
      <p className="eyebrow"><PiTruckBold aria-hidden="true" /> {t.delivery.eyebrow}</p>
      <h1 className="display-xl mt-3">{t.delivery.title}</h1>
      <div className="mt-10 overflow-hidden rounded-3xl bg-paper shadow-soft">
        <table className="w-full text-start">
          <caption className="sr-only">{t.delivery.caption}</caption>
          <thead className="bg-leaf text-start text-sm text-white">
            <tr><th className="p-4 text-start">{t.delivery.area}</th><th className="p-4 text-start">{t.delivery.time}</th><th className="p-4 text-end">{t.delivery.fee}</th></tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.id} className="border-t border-line">
                <td className="p-4 font-bold">{zone.name}</td>
                <td className="p-4 text-ink-soft">{zone.eta || "—"}</td>
                <td className="p-4 text-end font-bold">{zone.fee_cents ? money(zone.fee_cents) : t.common.free}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {settings.free_delivery_threshold_cents > 0 && (
        <p className="mt-4 rounded-2xl bg-mint p-4 font-bold text-leaf-dark">{t.delivery.freeEverywhere(money(settings.free_delivery_threshold_cents))}</p>
      )}
      <div className="prose-jadeer mt-6">
        {t.delivery.sections.map((section) => (
          <section key={section.h}>
            <h2>{section.h}</h2>
            <p>{section.p}</p>
          </section>
        ))}
        {settings.order_notice && <p>{settings.order_notice}</p>}
      </div>
    </div>
  );
}
