// The public address of the website: SITE_URL (recommended), otherwise
// the hosting platform's default domain.

export function siteUrl(): string | null {
  const configured =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "");

  try {
    const url = new URL(configured);
    return url.protocol === "https:" || url.hostname === "localhost"
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

/** Search engines may list the site only once its real address is set. */
export function searchIndexingEnabled(): boolean {
  return Boolean(process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL);
}

export function siteUrlOrLocal(): URL {
  return new URL(siteUrl() ?? "http://localhost:3000");
}

export const SITE_NAME = "Ja'deer Organics";
export const SITE_NAME_AR = "جدير";
export const SITE_SLOGAN = "You deserve this way of life";
export const SITE_DESCRIPTION =
  "Ja'deer Organics is a Lebanese organic food and natural lifestyle shop by Rasha Yassine: " +
  "cold-pressed olive oil, pomegranate molasses, healthy sauces, natural syrups, matcha and " +
  "organic body care — preservative-free and pesticide-free, delivered across Lebanon with cash on delivery.";
