import type { Metadata } from "next";
import BagPage from "@/components/store/bag-page";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.bag.title, robots: { index: false, follow: true } };
}

export default function Page() {
  return (
    <div className="container-x pt-6 md:pt-10">
      <BagPage />
    </div>
  );
}
