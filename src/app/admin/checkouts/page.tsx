import type { Metadata } from "next";
import { PiWhatsappLogoBold } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { currentTime, formatDateTime, money } from "@/lib/format";
import { markLeadContacted } from "@/lib/admin-actions/care";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import { Empty, PageHeader, Pill } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Unfinished checkouts" };
export const instant = false;

type Lead = { id: string; phone: string; name: string; zone_name: string; items: { name: string; label: string; quantity: number }[]; subtotal_cents: number; contacted_at: string | null; updated_at: string };

export default async function CheckoutsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const now = currentTime();
  const since = new Date(now - 30 * 86_400_000).toISOString();
  const quiet = new Date(now - 30 * 60_000).toISOString();
  const { data } = await supabase.from("checkout_leads").select("*").gte("updated_at", since).lte("updated_at", quiet).order("updated_at", { ascending: false });
  const leads = (data ?? []) as Lead[];

  return (
    <div>
      <PageHeader
        title="Unfinished checkouts"
        description="People who typed their phone number at checkout but didn't place the order (after 30 minutes). A friendly WhatsApp often saves the sale."
      />
      {leads.length === 0 ? (
        <Empty title="No unfinished checkouts" text="Nice — everyone who started checking out finished." />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {leads.map((l) => {
            const first = l.name.split(" ")[0] || "there";
            const message = `Hi ${first}, this is Ja'deer Organics We noticed you didn't finish your order (${l.items.map((i) => i.name).join(", ")}). Can we help you complete it? We can take it right here on WhatsApp`;
            return (
              <li key={l.id} className={`rounded-3xl border bg-white p-5 ${l.contacted_at ? "border-line opacity-70" : "border-orange/50"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{l.name || "No name"} · {l.phone}</span>
                  <span className="font-display text-xl">{money(l.subtotal_cents)}</span>
                </div>
                <p className="text-xs text-ink-soft">{formatDateTime(l.updated_at)}{l.zone_name ? ` · ${l.zone_name}` : ""}</p>
                <ul className="mt-3 text-sm text-ink-soft">{l.items.map((i, n) => <li key={n}>{i.quantity} × {i.name} ({i.label})</li>)}</ul>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-[#25d366] text-white"><PiWhatsappLogoBold /> Follow up</a>
                  <ActionForm action={markLeadContacted} className="flex gap-2">
                    <input type="hidden" name="id" value={l.id} />
                    {!l.contacted_at && <SubmitButton name="intent" value="done" className="btn btn-ink btn-sm" pendingText="…"> Contacted</SubmitButton>}
                    <SubmitButton name="intent" value="delete" className="btn btn-soft btn-sm text-tomato" pendingText="…">Remove</SubmitButton>
                  </ActionForm>
                  {l.contacted_at && <Pill color="#23752e" bg="#e3f4d8">Contacted</Pill>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
