import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsInput } from "@/lib/format";
import { saveSettings } from "@/lib/admin-actions/setup";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Settings" };
export const instant = false;

function Section({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 rounded-3xl border border-line bg-white p-5 md:p-6">
      <div>
        <h2 className="font-display text-xl font-extrabold">{title}</h2>
        {text && <p className="text-sm text-ink-soft">{text}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: s } = await supabase.from("store_settings").select("*").eq("id", 1).single();
  if (!s) return <p>Settings are missing. Run the database setup.</p>;

  return (
    <div>
      <PageHeader title="Settings" description="Contact details, announcement bar, delivery rules and order options." />
      <ActionForm action={saveSettings} className="grid gap-5 xl:grid-cols-2">
        <Section title="Orders" text="Pause online orders any time (e.g. during holidays).">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-mint/60 p-4 font-bold">
            Accepting online orders
            <input type="checkbox" name="accepting_orders" defaultChecked={s.accepting_orders} className="size-6 accent-[var(--color-leaf)]" />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="field"><span className="field-label">Free delivery from $</span><input name="free_delivery" defaultValue={dollarsInput(s.free_delivery_threshold_cents)} className="input" inputMode="decimal" /><span className="field-hint">0 = never free</span></label>
            <label className="field"><span className="field-label">Minimum order $</span><input name="min_order" defaultValue={dollarsInput(s.min_order_cents)} className="input" inputMode="decimal" /></label>
            <label className="field"><span className="field-label">“Low stock” at</span><input type="number" min={0} name="low_stock_threshold" defaultValue={s.low_stock_threshold} className="input" /></label>
          </div>
          <label className="field"><span className="field-label">Note shown at checkout</span><input name="order_notice" defaultValue={s.order_notice} className="input" maxLength={300} /></label>
        </Section>

        <Section title="Announcement bar" text="The green scrolling bar at the top of every page.">
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="announcement_enabled" defaultChecked={s.announcement_enabled} className="size-5 accent-[var(--color-leaf)]" /> Show the announcement bar</label>
          <label className="field"><span className="field-label">Text</span><input name="announcement_text" defaultValue={s.announcement_text} className="input" maxLength={200} /></label>
        </Section>

        <Section title="Contact" text="The WhatsApp number shows a chat button on every page.">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field"><span className="field-label">WhatsApp number</span><input name="whatsapp" defaultValue={s.whatsapp} className="input" inputMode="tel" maxLength={40} placeholder="70 123 456" /></label>
            <label className="field"><span className="field-label">Phone</span><input name="phone" defaultValue={s.phone} className="input" maxLength={40} /></label>
          </div>
          <label className="field"><span className="field-label">Email</span><input name="email" type="email" defaultValue={s.email} className="input" maxLength={254} /></label>
        </Section>

        <Section title="Social media & brand">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field"><span className="field-label">Shop name</span><input name="store_name" defaultValue={s.store_name} className="input" maxLength={80} /></label>
            <label className="field"><span className="field-label">Tagline</span><input name="tagline" defaultValue={s.tagline} className="input" maxLength={200} /></label>
          </div>
          <label className="field"><span className="field-label">Instagram</span><input name="instagram_url" defaultValue={s.instagram_url} className="input" maxLength={300} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field"><span className="field-label">Facebook</span><input name="facebook_url" defaultValue={s.facebook_url} className="input" maxLength={300} placeholder="https://" /></label>
            <label className="field"><span className="field-label">TikTok</span><input name="tiktok_url" defaultValue={s.tiktok_url} className="input" maxLength={300} placeholder="https://" /></label>
          </div>
        </Section>

        <div className="sticky bottom-20 z-10 rounded-3xl bg-white/90 p-3 shadow-pop backdrop-blur xl:col-span-2 lg:bottom-4">
          <SubmitButton className="btn btn-primary w-full">Save settings</SubmitButton>
        </div>
      </ActionForm>
      <p className="mt-6 text-sm text-ink-soft">
        Signed in as {admin.email}. To add another administrator, run <code className="rounded bg-white px-1.5 py-0.5">npm run admin:create</code> (see README).
      </p>
    </div>
  );
}
