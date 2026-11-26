import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of sale",
  description: "Terms of sale for orders placed on the Ja'deer Organics website.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="container-x max-w-3xl pt-8 md:pt-14">
      <h1 className="display-lg">Terms of sale</h1>
      <div className="prose-jadeer mt-6">
        <h2>Orders</h2>
        <p>An order is confirmed once our team contacts you. We may cancel an order if a product is unavailable or the details cannot be confirmed.</p>
        <h2>Prices</h2>
        <p>Prices are in US dollars and include all taxes. Delivery fees are shown before you place your order.</p>
        <h2>Payment</h2>
        <p>Payment is cash on delivery. Please have the exact amount ready when possible.</p>
        <h2>Delivery</h2>
        <p>Delivery times are estimates. We will keep you informed if anything changes.</p>
        <h2>Returns</h2>
        <p>Opened food and personal care products cannot be returned. Damaged or incorrect items are replaced or refunded when reported within 48 hours.</p>
        <h2>Contact</h2>
        <p>For any question about these terms, please contact us through our contact page.</p>
      </div>
    </div>
  );
}
