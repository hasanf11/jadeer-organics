import type { Metadata } from "next";
import { PiMapPinFill } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { googleMapsUrl } from "@/lib/maps";
import { deleteStore, saveStore } from "@/lib/admin-actions/setup";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import DeleteButton from "@/components/admin/delete-button";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Stores & maps" };
export const instant = false;

type Store = { id: string; name: string; name_ar: string; area: string; area_ar: string; address: string; address_ar: string; phone: string; hours: string; hours_ar: string; latitude: number | null; longitude: number | null; maps_query: string; is_active: boolean; sort_order: number };

function StoreFields({ s }: { s?: Store }) {
  return (
    <>
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field"><span className="field-label">Store name</span><input name="name" defaultValue={s?.name} className="input" required maxLength={80} /></label>
        <label className="field"><span className="field-label">Arabic name</span><input name="name_ar" defaultValue={s?.name_ar} className="input text-right" dir="rtl" maxLength={80} /></label>
        <label className="field"><span className="field-label">Area (short)</span><input name="area" defaultValue={s?.area} className="input" maxLength={80} placeholder="Haret Hreik, Beirut" /></label>
        <label className="field"><span className="field-label">Area (Arabic)</span><input name="area_ar" defaultValue={s?.area_ar} className="input text-right" dir="rtl" maxLength={80} /></label>
        <label className="field"><span className="field-label">Phone</span><input name="phone" defaultValue={s?.phone} className="input" maxLength={40} /></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field"><span className="field-label">Address</span><input name="address" defaultValue={s?.address} className="input" maxLength={300} /></label>
        <label className="field"><span className="field-label">Address (Arabic)</span><input name="address_ar" defaultValue={s?.address_ar} className="input text-right" dir="rtl" maxLength={300} /></label>
        <label className="field"><span className="field-label">Opening hours</span><input name="hours" defaultValue={s?.hours} className="input" maxLength={200} placeholder="Mon–Sat 9 AM – 9 PM" /></label>
        <label className="field"><span className="field-label">Opening hours (Arabic)</span><input name="hours_ar" defaultValue={s?.hours_ar} className="input text-right" dir="rtl" maxLength={200} /></label>
      </div>
      <fieldset className="grid gap-3 rounded-2xl bg-cream p-3">
        <legend className="px-1 text-sm font-bold"> Map location</legend>
        <label className="field"><span className="field-label">Paste a Google Maps link or “lat, lng” (easiest)</span><input name="maps_link" className="input" maxLength={500} placeholder="https://maps.google.com/?q=33.8564,35.5066" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="field"><span className="field-label">Latitude</span><input name="latitude" defaultValue={s?.latitude ?? ""} className="input" inputMode="decimal" /></label>
          <label className="field"><span className="field-label">Longitude</span><input name="longitude" defaultValue={s?.longitude ?? ""} className="input" inputMode="decimal" /></label>
        </div>
        <label className="field"><span className="field-label">…or a Google Maps search (if no coordinates)</span><input name="maps_query" defaultValue={s?.maps_query} className="input" maxLength={200} placeholder="Jadeer Organics Kayfoun" /></label>
      </fieldset>
      <div className="flex flex-wrap items-center gap-4">
        <label className="field w-28"><span className="field-label">Order</span><input type="number" name="sort_order" min={0} defaultValue={s?.sort_order ?? 0} className="input" /></label>
        <label className="flex items-center gap-2 pt-5 font-semibold"><input type="checkbox" name="is_active" defaultChecked={s?.is_active ?? true} className="size-5 accent-[var(--color-leaf)]" /> Show on website</label>
      </div>
    </>
  );
}

export default async function StoresAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("store_locations").select("*").order("sort_order");
  const stores = (data ?? []) as Store[];

  return (
    <div>
      <PageHeader title="Stores & maps" description="Your shops appear on the Stores page, the home page and the footer. Customers tap them to open Google Maps." />
      <div className="grid gap-4 xl:grid-cols-2">
        {stores.map((s) => (
          <section key={s.id} className="rounded-3xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display text-xl">{s.area || s.name}</h2>
              <a href={googleMapsUrl(s)} target="_blank" rel="noopener noreferrer" className="btn btn-soft btn-sm"><PiMapPinFill className="text-tomato" /> Test map link</a>
            </div>
            {s.latitude == null && <p className="mb-3 rounded-xl bg-butter px-3 py-2 text-sm font-semibold">Tip: paste the exact Google Maps pin for this shop so the map opens precisely.</p>}
            <ActionForm action={saveStore} className="grid gap-3">
              <StoreFields s={s} />
              <SubmitButton className="btn btn-primary btn-sm justify-self-start">Save</SubmitButton>
            </ActionForm>
            <div className="mt-2 flex justify-end"><DeleteButton action={deleteStore} id={s.id} confirm={`Delete ${s.name}?`} /></div>
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-3xl border-2 border-dashed border-leaf/40 bg-mint/30 p-5">
        <h2 className="mb-3 font-display text-xl">Add a store</h2>
        <ActionForm action={saveStore} className="grid gap-3" resetOnSuccess>
          <StoreFields />
          <SubmitButton className="btn btn-primary justify-self-start">Add store</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
