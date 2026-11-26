/**
 * Product images are either stored in the Supabase "catalog" bucket
 * (a storage path) or shipped with the website (a path starting with "/").
 */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("/")) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  return `${base}/storage/v1/object/public/catalog/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
