"use client";

import Image from "next/image";
import { useState } from "react";
import { PiArrowLeftBold, PiArrowRightBold, PiStarFill, PiTrashBold, PiUploadSimpleBold } from "react-icons/pi";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import { updateProductImage, uploadProductImages } from "@/lib/admin-actions/products";
import { imageUrl } from "@/lib/images";

type ImageRow = { id: string; path: string; alt: string };

export default function ImageManager({ productId, images }: { productId: string; images: ImageRow[] }) {
  const [previews, setPreviews] = useState<string[]>([]);

  return (
    <div className="grid gap-4">
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, i) => {
            const src = imageUrl(image.path);
            return (
              <li key={image.id} className="overflow-hidden rounded-2xl border border-line bg-cream">
                <div className="relative aspect-[4/5]">
                  {src && <Image src={src} alt={image.alt} fill sizes="200px" className="object-cover" />}
                  {i === 0 && (
                    <span className="chip absolute left-2 top-2 bg-sun text-ink"><PiStarFill /> Main photo</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 p-1.5">
                  {(["up", "down", "first"] as const).map((intent) => {
                    if ((intent === "up" || intent === "first") && i === 0) return null;
                    if (intent === "down" && i === images.length - 1) return null;
                    if (intent === "first" && i === 1) return null;
                    return (
                      <ActionForm key={intent} action={updateProductImage}>
                        <input type="hidden" name="id" value={image.id} />
                        <input type="hidden" name="product_id" value={productId} />
                        <input type="hidden" name="intent" value={intent} />
                        <SubmitButton className="icon-btn size-9" pendingText="…">
                          {intent === "up" ? <PiArrowLeftBold aria-label="Move earlier" /> : intent === "down" ? <PiArrowRightBold aria-label="Move later" /> : <PiStarFill aria-label="Make main photo" className="text-orange" />}
                        </SubmitButton>
                      </ActionForm>
                    );
                  })}
                  <ActionForm action={updateProductImage} confirm="Remove this photo?" className="ml-auto">
                    <input type="hidden" name="id" value={image.id} />
                    <input type="hidden" name="product_id" value={productId} />
                    <input type="hidden" name="intent" value="delete" />
                    <SubmitButton className="icon-btn size-9 text-tomato" pendingText="…">
                      <PiTrashBold aria-label="Remove photo" />
                    </SubmitButton>
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl bg-cream p-4 text-sm text-ink-soft">No photos yet — the shop shows the illustration instead.</p>
      )}

      <ActionForm action={uploadProductImages} resetOnSuccess onSuccess={() => setPreviews([])} className="grid gap-3 rounded-2xl border-2 border-dashed border-leaf/40 bg-mint/30 p-4">
        <input type="hidden" name="product_id" value={productId} />
        <label className="flex cursor-pointer flex-col items-center gap-2 py-4 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-white text-leaf shadow-soft"><PiUploadSimpleBold size={26} /></span>
          <span className="font-bold">Choose photos to upload</span>
          <span className="text-sm text-ink-soft">JPG, PNG or WebP · up to 10 at once · they&apos;re optimised automatically</span>
          <input
            type="file"
            name="images"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="sr-only"
            onChange={(e) => {
              previews.forEach((p) => URL.revokeObjectURL(p));
              setPreviews(Array.from(e.target.files ?? []).slice(0, 10).map((f) => URL.createObjectURL(f)));
            }}
          />
        </label>
        {previews.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {previews.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element -- local preview of a file the admin picked
                <img key={p} src={p} alt="" className="size-20 rounded-xl object-cover" />
              ))}
            </div>
            <SubmitButton className="btn btn-primary" pendingText="Uploading…">Upload {previews.length} photo{previews.length > 1 ? "s" : ""}</SubmitButton>
          </>
        )}
      </ActionForm>
    </div>
  );
}
