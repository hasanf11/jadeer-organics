"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { adminClient, checkbox, dbMessage, failure, id, int, refreshStore, success, text, type ActionState } from "@/lib/admin";
import { ART_SHAPES, BADGE_KEYS } from "@/lib/badges";
import { parseDollars, slugify } from "@/lib/format";

const HEX = /^#[0-9a-f]{6}$/i;

function productFields(formData: FormData) {
  const name = text(formData, "name", 120);
  const slug = slugify(text(formData, "slug", 130) || name);
  const categoryId = id(formData, "category_id");
  const status = text(formData, "status", 20);
  const shape = text(formData, "art_shape", 20);
  const color = text(formData, "art_color", 7);
  const background = text(formData, "art_background", 7);
  const badges = formData.getAll("badges").filter((b): b is string => typeof b === "string" && (BADGE_KEYS as string[]).includes(b));

  if (name.length < 1) return { error: "Please enter a product name." } as const;
  if (!slug) return { error: "Please enter a web address (slug)." } as const;

  return {
    values: {
      name,
      name_ar: text(formData, "name_ar", 120),
      slug,
      category_id: categoryId,
      tagline: text(formData, "tagline", 200),
      description: text(formData, "description", 10000),
      ingredients: text(formData, "ingredients", 3000),
      how_to_use: text(formData, "how_to_use", 3000),
      badges,
      art_shape: (ART_SHAPES as readonly string[]).includes(shape) ? shape : "bottle",
      art_color: HEX.test(color) ? color : "#3f8f3a",
      art_background: HEX.test(background) ? background : "#eaf4dc",
      is_featured: checkbox(formData, "is_featured"),
      status: ["draft", "published", "archived"].includes(status) ? status : "draft",
      sort_order: Math.max(0, int(formData, "sort_order")),
    },
  } as const;
}

export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const fields = productFields(formData);
  if ("error" in fields) return failure(fields.error ?? "Please check the form.");

  const { supabase } = await adminClient();
  const { data, error } = await supabase.from("products").insert(fields.values).select("id").single();
  if (error || !data) return failure(dbMessage(error, "Could not create the product."));

  // A first size so the product can be sold straight away.
  const price = parseDollars(formData.get("first_price"));
  const label = text(formData, "first_label", 40);
  if (price != null && label) {
    await supabase.from("product_variants").insert({
      product_id: data.id,
      label,
      price_cents: price,
      stock_quantity: Math.max(0, int(formData, "first_stock")),
    });
  }

  refreshStore();
  revalidatePath("/admin/products");
  redirect(`/admin/products/${data.id}?created=1`);
}

export async function updateProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const productId = id(formData);
  if (!productId) return failure("Invalid product.");
  const fields = productFields(formData);
  if ("error" in fields) return failure(fields.error ?? "Please check the form.");

  const { supabase } = await adminClient();
  const { error } = await supabase.from("products").update(fields.values).eq("id", productId);
  if (error) return failure(dbMessage(error, "Could not save the product."));

  refreshStore();
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  return success("Saved! The shop is updated.");
}

export async function setProductStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const productId = id(formData);
  const status = text(formData, "status", 20);
  if (!productId || !["draft", "published", "archived"].includes(status)) return failure("Invalid request.");

  const { supabase } = await adminClient();
  if (status === "published") {
    const { count } = await supabase.from("product_variants").select("id", { count: "exact", head: true }).eq("product_id", productId).eq("is_active", true);
    if (!count) return failure("Add at least one size with a price before publishing.");
  }
  const { error } = await supabase.from("products").update({ status }).eq("id", productId);
  if (error) return failure(dbMessage(error));

  refreshStore();
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  return success(status === "published" ? "Published — it's live in the shop" : status === "draft" ? "Hidden from the shop (draft)." : "Archived.");
}

export async function toggleFeatured(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const productId = id(formData);
  if (!productId) return failure("Invalid request.");
  const { supabase } = await adminClient();
  const { error } = await supabase.from("products").update({ is_featured: checkbox(formData, "value") }).eq("id", productId);
  if (error) return failure(dbMessage(error));
  refreshStore();
  revalidatePath("/admin/products");
  return success("Updated.");
}

export async function duplicateProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const productId = id(formData);
  if (!productId) return failure("Invalid request.");
  const { supabase } = await adminClient();

  const { data: product } = await supabase.from("products").select("*, product_variants(*)").eq("id", productId).single();
  if (!product) return failure("Product not found.");

  const suffix = randomUUID().slice(0, 4);
  const { data: copy, error } = await supabase
    .from("products")
    .insert({
      category_id: product.category_id,
      name: `${product.name} (copy)`.slice(0, 120),
      name_ar: product.name_ar,
      slug: `${product.slug}-copy-${suffix}`.slice(0, 130),
      tagline: product.tagline,
      description: product.description,
      ingredients: product.ingredients,
      how_to_use: product.how_to_use,
      badges: product.badges,
      art_shape: product.art_shape,
      art_color: product.art_color,
      art_background: product.art_background,
      status: "draft",
      sort_order: product.sort_order,
    })
    .select("id")
    .single();
  if (error || !copy) return failure(dbMessage(error, "Could not duplicate."));

  const variants = (product.product_variants ?? []) as { label: string; price_cents: number; compare_at_cents: number | null; sort_order: number }[];
  if (variants.length) {
    await supabase.from("product_variants").insert(
      variants.map((v) => ({ product_id: copy.id, label: v.label, price_cents: v.price_cents, compare_at_cents: v.compare_at_cents, sort_order: v.sort_order, stock_quantity: 0 })),
    );
  }

  revalidatePath("/admin/products");
  redirect(`/admin/products/${copy.id}`);
}

export async function deleteProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const productId = id(formData);
  if (!productId) return failure("Invalid request.");
  const { supabase } = await adminClient();

  const { count } = await supabase.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", productId);
  if (count) {
    await supabase.from("products").update({ status: "archived" }).eq("id", productId);
    refreshStore();
    revalidatePath("/admin/products");
    return success("This product has orders, so it was archived (hidden) instead of deleted.");
  }

  const { data: images } = await supabase.from("product_images").select("path").eq("product_id", productId);
  const stored = (images ?? []).map((i) => i.path).filter((p) => !p.startsWith("/"));
  if (stored.length) await supabase.storage.from("catalog").remove(stored);

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return failure(dbMessage(error, "Could not delete."));

  refreshStore();
  revalidatePath("/admin/products");
  redirect("/admin/products?deleted=1");
}

// ---------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------

export async function saveVariant(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const productId = id(formData, "product_id");
  const variantId = id(formData);
  const label = text(formData, "label", 40);
  const price = parseDollars(formData.get("price"));
  const compareRaw = text(formData, "compare_at", 12);
  const compare = compareRaw ? parseDollars(compareRaw) : null;

  if (!productId) return failure("Invalid product.");
  if (!label) return failure("Please enter a size, e.g. 500 ml.");
  if (price == null) return failure("Please enter a valid price, e.g. 6.50");
  if (compareRaw && compare == null) return failure("Please enter a valid “was” price.");
  if (compare != null && compare <= price) return failure("The “was” price should be higher than the price.");

  const values = {
    label,
    price_cents: price,
    compare_at_cents: compare,
    sku: text(formData, "sku", 60) || null,
    is_active: formData.has("is_active") ? checkbox(formData, "is_active") : true,
    sort_order: Math.max(0, int(formData, "sort_order")),
  };

  const { supabase } = await adminClient();
  const { error } = variantId
    ? await supabase.from("product_variants").update(values).eq("id", variantId).eq("product_id", productId)
    : await supabase.from("product_variants").insert({ ...values, product_id: productId, stock_quantity: Math.max(0, int(formData, "stock")) });

  if (error) return failure(dbMessage(error, "Could not save the size."));
  refreshStore();
  revalidatePath(`/admin/products/${productId}`);
  return success(variantId ? "Size saved." : "Size added.");
}

export async function deleteVariant(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const productId = id(formData, "product_id");
  const variantId = id(formData);
  if (!productId || !variantId) return failure("Invalid request.");
  const { supabase } = await adminClient();
  const { error } = await supabase.from("product_variants").delete().eq("id", variantId).eq("product_id", productId);
  if (error) return failure(dbMessage(error, "Could not delete the size."));
  refreshStore();
  revalidatePath(`/admin/products/${productId}`);
  return success("Size deleted.");
}

// ---------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------

const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadProductImages(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const productId = id(formData, "product_id");
  if (!productId) return failure("Invalid product.");
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 10);
  if (!files.length) return failure("Choose at least one photo.");

  const { supabase } = await adminClient();
  const { data: product } = await supabase.from("products").select("name").eq("id", productId).single();
  if (!product) return failure("Product not found.");

  const { data: last } = await supabase.from("product_images").select("sort_order").eq("product_id", productId).order("sort_order", { ascending: false }).limit(1);
  let order = (last?.[0]?.sort_order ?? -1) + 1;
  let uploaded = 0;

  for (const file of files) {
    if (file.size > MAX_BYTES) return failure(`${file.name} is larger than 8 MB.`);
    let webp: Buffer;
    try {
      // Re-encoding strips hidden data (location, camera) and rejects
      // anything that isn't really an image.
      webp = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 })
        .rotate()
        .resize(1600, 2000, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 84 })
        .toBuffer();
    } catch {
      return failure(`${file.name} is not a supported image.`);
    }

    const path = `products/${productId}/${randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage.from("catalog").upload(path, webp, { contentType: "image/webp", cacheControl: "31536000" });
    if (uploadError) return failure("Upload failed. Please try again.");

    const { error } = await supabase.from("product_images").insert({ product_id: productId, path, alt: product.name, sort_order: order++ });
    if (error) return failure(dbMessage(error, "Could not save the photo."));
    uploaded++;
  }

  refreshStore();
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  return success(`${uploaded} photo${uploaded > 1 ? "s" : ""} added.`);
}

export async function updateProductImage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const productId = id(formData, "product_id");
  const imageId = id(formData);
  const intent = text(formData, "intent", 20);
  if (!productId || !imageId) return failure("Invalid request.");

  const { supabase } = await adminClient();
  const { data: images } = await supabase.from("product_images").select("id, path, sort_order").eq("product_id", productId).order("sort_order");
  const list = images ?? [];
  const index = list.findIndex((i) => i.id === imageId);
  if (index < 0) return failure("Photo not found.");

  if (intent === "delete") {
    const image = list[index];
    if (!image.path.startsWith("/")) await supabase.storage.from("catalog").remove([image.path]);
    await supabase.from("product_images").delete().eq("id", imageId);
  } else if (intent === "alt") {
    await supabase.from("product_images").update({ alt: text(formData, "alt", 200) }).eq("id", imageId);
  } else {
    const target = intent === "first" ? 0 : intent === "up" ? index - 1 : intent === "down" ? index + 1 : index;
    if (target >= 0 && target < list.length && target !== index) {
      const [moved] = list.splice(index, 1);
      list.splice(target, 0, moved);
      await Promise.all(list.map((image, i) => supabase.from("product_images").update({ sort_order: i }).eq("id", image.id)));
    }
  }

  refreshStore();
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  return success(intent === "delete" ? "Photo removed." : "Updated.");
}
