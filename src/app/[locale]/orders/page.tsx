import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import MyOrders from "@/components/store/my-orders";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.myOrders.metaTitle, robots: { index: false, follow: true } };
}

export default async function MyOrdersPage() {
  const { t } = await getI18n();
  return (
    <div className="container-x max-w-3xl pt-8 md:pt-12">
      <p className="eyebrow">{t.myOrders.eyebrow}</p>
      <h1 className="display-lg mt-3">{t.myOrders.title}</h1>
      <p className="mt-3 text-ink-soft">{t.myOrders.intro}</p>
      <MyOrders />
    </div>
  );
}
