import Image from "next/image";
import ProductArt from "@/components/product-art";
import { imageUrl } from "@/lib/images";
import type { ArtShape } from "@/lib/badges";

/** A product photo when there is one, otherwise its illustration. */
export default function ProductVisual({
  image,
  alt,
  art,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority = false,
  className = "",
}: {
  image: string | null | undefined;
  alt: string;
  art: { shape: ArtShape; color: string; background: string };
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const src = imageUrl(image);

  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <ProductArt
      shape={art.shape}
      color={art.color}
      background={art.background}
      name={alt}
      className={`absolute inset-0 h-full w-full ${className}`}
    />
  );
}
