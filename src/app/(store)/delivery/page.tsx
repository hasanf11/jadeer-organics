import { getStorefront } from "@/lib/catalog";
import { money } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Delivery & returns",
  description: "Delivery areas, fees and times across Lebanon, cash on delivery, and our returns policy at Ja'deer Organics.",
  path: "/delivery",
});

export default async function DeliveryPage() {
  const { zones, settings } = await getStorefront();
  return (
    <div className="container-x max-w-3xl pt-8 md:pt-14">
      <p className="eyebrow">All over Lebanon</p>
      <h1 className="display-xl mt-4">Delivery &amp; returns</h1>

      <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-paper">
        <table className="w-full text-left">
          <caption className="sr-only">Delivery fees by area</caption>
          <thead className="bg-sand text-xs uppercase tracking-[0.14em] text-ink-soft">
            <tr><th className="p-4">Area</th><th className="p-4">Delivery time</th><th className="p-4 text-right">Fee</th></tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.id} className="border-t border-line">
                <td className="p-4 font-semibold">{zone.name}</td>
                <td className="p-4 text-ink-soft">{zone.eta || "—"}</td>
                <td className="p-4 text-right font-semibold">{zone.fee_cents ? money(zone.fee_cents) : "Free"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {settings.free_delivery_threshold_cents > 0 && (
        <p className="mt-4 rounded-xl bg-mint p-4 font-semibold text-leaf-dark">
          Free delivery everywhere on orders over {money(settings.free_delivery_threshold_cents)}.
        </p>
      )}

      <div className="prose-jadeer mt-6">
        <h2>Cash on delivery</h2>
        <p>Pay the driver in cash when your order arrives. We will call or WhatsApp you to confirm your order before it leaves our shop.</p>
        {settings.order_notice && <p>{settings.order_notice}</p>}
        <h2>Returns &amp; quality promise</h2>
        <p>
          Because our products are food and personal care, we can&apos;t take back opened items. If something arrives
          damaged, wrong or not up to our standards, message us within 48 hours with a photo and we&apos;ll replace it or
          refund you.
        </p>
        <h2>Storage</h2>
        <p>Our sauces contain no preservatives: keep them in the fridge once opened and enjoy them within a few weeks.</p>
      </div>
    </div>
  );
}
