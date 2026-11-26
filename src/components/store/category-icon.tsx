import {
  PiAvocadoBold,
  PiCoffeeBold,
  PiDropBold,
  PiFlowerLotusBold,
  PiJarBold,
  PiLeafBold,
  PiPepperBold,
  PiWineBold,
} from "react-icons/pi";

const ICONS: Record<string, typeof PiLeafBold> = {
  "oils-vinegars": PiDropBold,
  "healthy-sauces": PiPepperBold,
  "natural-syrups": PiWineBold,
  "molasses-spreads": PiJarBold,
  "teas-wellness": PiCoffeeBold,
  keto: PiAvocadoBold,
  "body-care": PiFlowerLotusBold,
};

/** A line icon for each category (new categories get a leaf). */
export default function CategoryIcon({ slug, size = 20, className = "" }: { slug: string; size?: number; className?: string }) {
  const Icon = ICONS[slug] ?? PiLeafBold;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
