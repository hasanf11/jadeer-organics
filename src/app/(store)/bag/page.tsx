import type { Metadata } from "next";
import BagPage from "@/components/store/bag-page";

export const metadata: Metadata = {
  title: "Your bag",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="container-x pt-6 md:pt-10">
      <BagPage />
    </div>
  );
}
