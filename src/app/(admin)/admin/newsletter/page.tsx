import type { Metadata } from "next";
import { PiCopyBold, PiDownloadSimpleBold } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { deleteSubscriber } from "@/lib/admin-actions/care";
import DeleteButton from "@/components/admin/delete-button";
import { Empty, PageHeader, Table } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Mailing list" };
export const instant = false;

export default async function NewsletterPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, count } = await supabase.from("newsletter_subscribers").select("id, email, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(1000);
  const emails = (data ?? []).map((s) => s.email).join(", ");

  return (
    <div>
      <PageHeader
        title="Mailing list"
        description={`${count ?? 0} people joined the Ja'deer club from the website footer.`}
        actions={
          <a href="/admin/newsletter/export" download className="btn btn-soft btn-sm"><PiDownloadSimpleBold /> Export to Excel</a>}
      />
      {!data?.length ? (
        <Empty title="No subscribers yet" />
      ) : (
        <>
          <details className="mb-4 rounded-2xl bg-white p-4">
            <summary className="flex cursor-pointer items-center gap-2 font-bold"><PiCopyBold /> All emails (to paste in your email app)</summary>
            <textarea readOnly value={emails} className="input mt-3 min-h-28 text-sm" aria-label="All emails" />
          </details>
          <Table>
            <thead><tr><th>Email</th><th>Joined</th><th><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold">{s.email}</td>
                  <td>{formatDate(s.created_at)}</td>
                  <td className="text-right"><DeleteButton action={deleteSubscriber} id={s.id} confirm={`Remove ${s.email}?`} label="Remove" /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}
