import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { ArtShape, BadgeKey } from "@/lib/badges";

export type Variant = {
  id: string;
  label: string;
  price: number;
  compareAt: number | null;
  stock: number;
};

export type ProductImage = { path: string; alt: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  tagline: string;
  description: string;
  ingredients: string;
  howToUse: string;
  badges: BadgeKey[];
  art: { shape: ArtShape; color: string; background: string };
  featured: boolean;
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  sortOrder: number;
  createdAt: string;
  variants: Variant[];
  images: ProductImage[];
  rating: { average: number; count: number };
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  color: string;
  emoji: string;
  image: string | null;
  productCount: number;
};

export type StoreLocation = {
  id: string;
  name: string;
  name_ar: string;
  area: string;
  address: string;
  phone: string;
  hours: string;
  latitude: number | null;
  longitude: number | null;
  maps_query: string;
};

export type DeliveryZone = {
  id: string;
  name: string;
  fee_cents: number;
  eta: string;
};

export type StoreSettings = {
  store_name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  announcement_enabled: boolean;
  announcement_text: string;
  free_delivery_threshold_cents: number;
  min_order_cents: number;
  low_stock_threshold: number;
  accepting_orders: boolean;
  order_notice: string;
};

export type Storefront = {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  locations: StoreLocation[];
  zones: DeliveryZone[];
  partners: { id: string; name: string; url: string }[];
};

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: "Ja'deer Organics",
  tagline: "Organic. Preservative-free. Pesticide-free.",
  phone: "",
  whatsapp: "",
  email: "",
  instagram_url: "https://www.instagram.com/jadeer.organics/",
  facebook_url: "",
  tiktok_url: "",
  announcement_enabled: true,
  announcement_text: "Cash on delivery all over Lebanon",
  free_delivery_threshold_cents: 5000,
  min_order_cents: 0,
  low_stock_threshold: 5,
  accepting_orders: true,
  order_notice: "",
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  name_ar: string;
  tagline: string;
  description: string;
  ingredients: string;
  how_to_use: string;
  badges: string[];
  art_shape: ArtShape;
  art_color: string;
  art_background: string;
  is_featured: boolean;
  category_id: string | null;
  sort_order: number;
  created_at: string;
  product_variants: {
    id: string;
    label: string;
    price_cents: number;
    compare_at_cents: number | null;
    stock_quantity: number;
    sort_order: number;
  }[];
  product_images: { path: string; alt: string; sort_order: number }[];
};

/**
 * Everything the storefront shows, read once and cached. Admin changes
 * and new orders refresh it through the "catalog" cache tag.
 */
export async function getStorefront(): Promise<Storefront> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const supabase = createPublicClient();

  const [settings, categories, products, locations, zones, partners, reviews] =
    await Promise.all([
      supabase.from("store_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("categories")
        .select("id, slug, name, name_ar, description, color, emoji, image_path, sort_order")
        .order("sort_order")
        .order("name"),
      supabase
        .from("products")
        .select(
          `id, slug, name, name_ar, tagline, description, ingredients, how_to_use, badges,
           art_shape, art_color, art_background, is_featured, category_id, sort_order, created_at,
           product_variants (id, label, price_cents, compare_at_cents, stock_quantity, sort_order),
           product_images (path, alt, sort_order)`,
        )
        .eq("status", "published")
        .order("sort_order")
        .order("name"),
      supabase
        .from("store_locations")
        .select("id, name, name_ar, area, address, phone, hours, latitude, longitude, maps_query")
        .order("sort_order"),
      supabase
        .from("delivery_zones")
        .select("id, name, fee_cents, eta")
        .order("sort_order")
        .order("name"),
      supabase.from("retail_partners").select("id, name, url").order("sort_order"),
      supabase.from("reviews").select("product_id, rating"),
    ]);

  for (const result of [settings, categories, products, locations, zones, partners]) {
    if (result.error) {
      throw new Error(`Could not load the store: ${result.error.message}`);
    }
  }

  const ratings = new Map<string, { total: number; count: number }>();
  for (const review of reviews.data ?? []) {
    const entry = ratings.get(review.product_id) ?? { total: 0, count: 0 };
    entry.total += review.rating;
    entry.count += 1;
    ratings.set(review.product_id, entry);
  }

  const categoryRows = categories.data ?? [];
  const categoryById = new Map(categoryRows.map((c) => [c.id, c]));

  const productList: Product[] = ((products.data ?? []) as ProductRow[]).map((row) => {
    const category = row.category_id ? categoryById.get(row.category_id) : undefined;
    const rating = ratings.get(row.id);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      nameAr: row.name_ar,
      tagline: row.tagline,
      description: row.description,
      ingredients: row.ingredients,
      howToUse: row.how_to_use,
      badges: row.badges as BadgeKey[],
      art: { shape: row.art_shape, color: row.art_color, background: row.art_background },
      featured: row.is_featured,
      categoryId: row.category_id,
      categorySlug: category?.slug ?? null,
      categoryName: category?.name ?? null,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      variants: [...row.product_variants]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((v) => ({
          id: v.id,
          label: v.label,
          price: v.price_cents,
          compareAt: v.compare_at_cents,
          stock: v.stock_quantity,
        })),
      images: [...row.product_images]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((image) => ({ path: image.path, alt: image.alt })),
      rating: rating
        ? { average: Math.round((rating.total / rating.count) * 10) / 10, count: rating.count }
        : { average: 0, count: 0 },
    };
  });

  // Products without any size for sale are hidden from the shop.
  const sellable = productList.filter((product) => product.variants.length > 0);

  return {
    settings: { ...DEFAULT_SETTINGS, ...(settings.data ?? {}) },
    categories: categoryRows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      nameAr: c.name_ar,
      description: c.description,
      color: c.color,
      emoji: c.emoji,
      image:
        c.image_path ??
        sellable.find((p) => p.categoryId === c.id && p.featured && p.images[0])?.images[0]?.path ??
        sellable.find((p) => p.categoryId === c.id && p.images[0])?.images[0]?.path ??
        null,
      productCount: sellable.filter((p) => p.categoryId === c.id).length,
    })),
    products: sellable,
    locations: (locations.data ?? []) as StoreLocation[],
    zones: (zones.data ?? []) as DeliveryZone[],
    partners: partners.data ?? [],
  };
}

export function minPrice(product: Product): number {
  return Math.min(...product.variants.map((v) => v.price));
}

export function totalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const { products } = await getStorefront();
  return products.find((p) => p.slug === slug) ?? null;
}

export type PublicReview = {
  id: string;
  author_name: string;
  rating: number;
  body: string;
  created_at: string;
};

export async function getProductReviews(productId: string): Promise<PublicReview[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("reviews", `reviews-${productId}`);

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, author_name, rating, body, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(30);

  return data ?? [];
}

/**
 * A compact catalog for the browser: the bag, wishlist and quick search
 * work instantly without asking the server.
 */
export type ClientProduct = {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  category: string | null;
  categorySlug: string | null;
  badges: BadgeKey[];
  art: Product["art"];
  image: string | null;
  variants: Variant[];
};

export function toClientCatalog(products: Product[]): ClientProduct[] {
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    nameAr: p.nameAr,
    category: p.categoryName,
    categorySlug: p.categorySlug,
    badges: p.badges,
    art: p.art,
    image: p.images[0]?.path ?? null,
    variants: p.variants,
  }));
}

export function toCardProduct(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    nameAr: product.nameAr,
    tagline: product.tagline,
    badges: product.badges,
    art: product.art,
    image: product.images[0]?.path ?? null,
    category: product.categoryName,
    variants: product.variants,
    rating: product.rating,
  };
}
