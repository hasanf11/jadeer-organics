import type { Metadata } from "next";
import type { Product, StoreLocation, StoreSettings } from "@/lib/catalog";
import { imageUrl } from "@/lib/images";
import { googleMapsUrl } from "@/lib/maps";
import { SITE_DESCRIPTION, SITE_NAME, siteUrlOrLocal } from "@/lib/site";
import { dictionary } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";

export function pageMetadata({
  locale,
  title,
  description,
  path,
  image,
}: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  image?: string | null;
}): Metadata {
  const t = dictionary(locale);
  const images = image ? [{ url: image, alt: title }] : undefined;
  const url = localePath(locale, path);
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: localePath("en", path), ar: localePath("ar", path), "x-default": localePath("en", path) },
    },
    openGraph: {
      type: "website",
      siteName: t.meta.siteName,
      url,
      title: `${title} | ${t.meta.siteName}`,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${t.meta.siteName}`,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

function absolute(path: string): string {
  return new URL(path, siteUrlOrLocal()).toString();
}

export function organizationJsonLd(settings: StoreSettings, locations: StoreLocation[]) {
  const sameAs = [settings.instagram_url, settings.facebook_url, settings.tiktok_url].filter(Boolean);
  const base = siteUrlOrLocal().toString();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}#organization`,
        name: SITE_NAME,
        alternateName: ["Jadeer Organics", "جدير"],
        url: base,
        logo: absolute("/brand/icon-512.png"),
        description: SITE_DESCRIPTION,
        founder: { "@type": "Person", name: "Rasha Yassine" },
        sameAs,
        ...(settings.email ? { email: settings.email } : {}),
        ...(settings.phone ? { telephone: settings.phone } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${base}#website`,
        url: base,
        name: SITE_NAME,
        publisher: { "@id": `${base}#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${absolute("/shop")}?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      ...locations.map((location) => ({
        "@type": "GroceryStore",
        name: location.name,
        parentOrganization: { "@id": `${base}#organization` },
        image: absolute("/brand/icon-512.png"),
        url: absolute("/stores"),
        hasMap: googleMapsUrl(location),
        address: {
          "@type": "PostalAddress",
          streetAddress: location.address,
          addressLocality: location.area,
          addressCountry: "LB",
        },
        ...(location.latitude != null && location.longitude != null
          ? { geo: { "@type": "GeoCoordinates", latitude: location.latitude, longitude: location.longitude } }
          : {}),
        ...(location.phone ? { telephone: location.phone } : {}),
        priceRange: "$",
        paymentAccepted: "Cash",
        currenciesAccepted: "USD",
      })),
    ],
  };
}

export function productJsonLd(product: Product, locale: Locale = "en") {
  const image = product.images.map((i) => imageUrl(i.path)).filter(Boolean) as string[];
  const prices = product.variants.map((v) => v.price / 100);
  const inStock = product.variants.some((v) => v.stock > 0);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    alternateName: product.nameEn !== product.name ? product.nameEn : undefined,
    description: product.tagline || product.description.slice(0, 300),
    image: image.length ? image.map(absolute) : [absolute("/brand/icon-512.png")],
    sku: product.variants[0]?.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: product.categoryName ?? undefined,
    url: absolute(localePath(locale, `/products/${product.slug}`)),
    inLanguage: locale,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: product.variants.length,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
    ...(product.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.average,
            reviewCount: product.rating.count,
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}
