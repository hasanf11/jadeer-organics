import type { Metadata } from "next";
import CheckoutForm from "@/components/store/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <CheckoutForm />
    </div>
  );
}
