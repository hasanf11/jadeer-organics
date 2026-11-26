import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy policy",
  description: "How Ja'deer Organics collects, uses and protects your personal information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="container-x max-w-3xl pt-8 md:pt-14">
      <h1 className="display-lg">Privacy policy</h1>
      <div className="prose-jadeer mt-6">
        <p>Your privacy matters to us. This page explains what we collect and why.</p>
        <h2>What we collect</h2>
        <ul>
          <li>When you order: your name, phone number, optional email, delivery address and notes.</li>
          <li>When you start checking out and type your phone number, we save your bag so we can help if you don&apos;t finish.</li>
          <li>When you contact us, review a product, join our mailing list or ask to be notified about stock: the details you enter.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To deliver and confirm your order and to contact you about it.</li>
          <li>To answer your messages and to send you news only if you signed up.</li>
        </ul>
        <p>We never sell your information. Your bag and wishlist are stored only in your own browser.</p>
        <h2>Security</h2>
        <p>
          Our website uses encrypted connections (HTTPS). Order links are private and random; only a secure fingerprint of
          each link is stored. Access to customer data is limited to the shop&apos;s administrators.
        </p>
        <h2>Your choices</h2>
        <p>You can ask us to see, correct or delete your information at any time through our contact page.</p>
      </div>
    </div>
  );
}
