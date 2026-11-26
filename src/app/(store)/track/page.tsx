import { pageMetadata } from "@/lib/seo";
import TrackForm from "@/components/store/track-form";

export const metadata = pageMetadata({
  title: "Track your order",
  description: "Check the status of your Ja'deer Organics order with your order number and phone number.",
  path: "/track",
});

export default function TrackPage() {
  return (
    <div className="container-x max-w-2xl pt-8 md:pt-14">
      <p className="eyebrow">No account needed</p>
      <h1 className="display-lg mt-2">Track your order</h1>
      <p className="mt-3 text-ink-soft">
        Enter the order number from your confirmation and the phone number you ordered with.
      </p>
      <TrackForm />
    </div>
  );
}
