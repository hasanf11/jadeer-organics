"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import ProductArt from "@/components/product-art";
import { imageUrl } from "@/lib/images";
import type { ArtShape } from "@/lib/badges";

export default function ProductGallery({
  name,
  images,
  art,
}: {
  name: string;
  images: { path: string; alt: string }[];
  art: { shape: ArtShape; color: string; background: string };
}) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const slides = images.length
    ? images.map((image) => ({ src: imageUrl(image.path), alt: image.alt || name }))
    : [{ src: null, alt: name }];
  const total = slides.length;

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * index, behavior: "smooth" });
  }

  return (
    <div className="lg:sticky lg:top-28" data-gallery>
      <div className="relative overflow-hidden rounded-3xl" style={{ background: art.background }}>
        <div
          ref={trackRef}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(event) => {
            const el = event.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
          aria-roledescription="carousel"
          aria-label={`${name} photos`}
        >
          {slides.map((slide, i) => (
            <div key={i} className="relative aspect-[4/5] w-full shrink-0 snap-center" aria-label={`${i + 1} of ${total}`}>
              {slide.src ? (
                <Image src={slide.src} alt={slide.alt} fill priority={i === 0} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              ) : (
                <ProductArt shape={art.shape} color={art.color} background={art.background} name={name} className="absolute inset-0 h-full w-full" />
              )}
            </div>
          ))}
        </div>

        {total > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`h-2 rounded-full bg-white shadow transition-all ${i === active ? "w-6" : "w-2 opacity-60"}`} />
            ))}
          </div>
        )}
      </div>

      {total > 1 && (
        <div className="mt-3 hidden gap-2 sm:flex">
          {slides.map((slide, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-square w-20 overflow-hidden rounded-xl border-2 transition-colors ${
                i === active ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              style={{ background: art.background }}
            >
              {slide.src ? (
                <Image src={slide.src} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <ProductArt shape={art.shape} color={art.color} background={art.background} name={name} className="absolute inset-0 h-full w-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
