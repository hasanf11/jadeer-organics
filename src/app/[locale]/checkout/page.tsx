import type { Metadata } from "next";
import CheckoutForm from "@/components/store/checkout-form";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.checkout.metaTitle, robots: { index: false, follow: false } };
}

export default function CheckoutPage() {
  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <CheckoutForm />
    </div>
  );
}
