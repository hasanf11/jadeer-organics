import type { Metadata } from "next";
import Link from "next/link";
import { PiEnvelopeSimpleBold, PiWhatsappLogoBold } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { setMessageHandled } from "@/lib/admin-actions/care";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import { Empty, PageHeader, Pill } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Messages" };
export const instant = false;

const TOPICS: Record<string, { label: string; color: string; bg: string }> = {
  general: { label: "Question", color: "#0b5f7a", bg: "#cfeaf6" },
  order: { label: "Order", color: "#8a5a00", bg: "#fff0b8" },
  product: { label: "Product", color: "#23752e", bg: "#e3f4d8" },
  wholesale: { label: "Wholesale", color: "#5b21b6", bg: "#ede4ff" },
  feedback: { label: "Feedback", color: "#a3245c", bg: "#fde2ef" },
};

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdmin();
  const params = await searchParams;
  const done = params.tab === "done";
  const supabase = await createClient();
  let query = supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100);
  query = done ? query.not("handled_at", "is", null) : query.is("handled_at", null);
  const { data } = await query;

  return (
    <div>
      <PageHeader title="Messages" description="Messages from the contact page. Reply on WhatsApp or by email in one tap." />
      <nav className="mb-5 flex gap-2" aria-label="Messages">
        <Link href="/admin/messages" className={`chip border-2 px-4 py-2 text-sm ${!done ? "border-ink bg-ink text-cream" : "border-line bg-white"}`}>New</Link>
        <Link href="/admin/messages?tab=done" className={`chip border-2 px-4 py-2 text-sm ${done ? "border-ink bg-ink text-cream" : "border-line bg-white"}`}>Handled</Link>
      </nav>
      {!data?.length ? (
        <Empty emoji="💌" title={done ? "No handled messages" : "Inbox zero 🎉"} />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {data.map((m) => (
            <li key={m.id} className="rounded-3xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">{m.name}</span>
                <Pill color={TOPICS[m.topic].color} bg={TOPICS[m.topic].bg}>{TOPICS[m.topic].label}</Pill>
              </div>
              <p className="text-xs text-ink-soft">{formatDateTime(m.created_at)} · {[m.phone, m.email].filter(Boolean).join(" · ")}</p>
              <p className="mt-3 whitespace-pre-line">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {m.phone && (
                  <a href={`https://wa.me/${m.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${m.name.split(" ")[0]}, this is Ja'deer Organics 🌿 Thank you for your message!`)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-[#25d366] text-white">
                    <PiWhatsappLogoBold /> WhatsApp
                  </a>
                )}
                {m.email && <a href={`mailto:${m.email}?subject=${encodeURIComponent("Your message to Ja'deer Organics")}`} className="btn btn-soft btn-sm"><PiEnvelopeSimpleBold /> Email</a>}
                <ActionForm action={setMessageHandled} className="flex gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  <SubmitButton name="intent" value={done ? "reopen" : "done"} className="btn btn-ink btn-sm" pendingText="…">{done ? "Mark as new" : "✓ Mark handled"}</SubmitButton>
                  <SubmitButton name="intent" value="delete" className="btn btn-soft btn-sm text-tomato" pendingText="…">Delete</SubmitButton>
                </ActionForm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
