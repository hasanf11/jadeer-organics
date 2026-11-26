import type { Metadata } from "next";
import Link from "next/link";
import { PiStarFill } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { setReviewStatus } from "@/lib/admin-actions/care";
import ActionForm, { SubmitButton } from "@/components/admin/action-form";
import { Empty, PageHeader, Pill } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Reviews" };
export const instant = false;

const TABS = [
  ["pending", "To approve"],
  ["approved", "Published"],
  ["rejected", "Hidden"],
] as const;

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  await requireAdmin();
  const params = await searchParams;
  const tab = TABS.some(([k]) => k === params.tab) ? (params.tab as string) : "pending";
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, author_name, rating, body, status, created_at, products(id, name, slug)")
    .eq("status", tab)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader title="Reviews" description="Customers' reviews appear on product pages only after you approve them." />
      <nav className="mb-5 flex gap-2" aria-label="Review status">
        {TABS.map(([key, label]) => (
          <Link key={key} href={`/admin/reviews?tab=${key}`} className={`chip border-2 px-4 py-2 text-sm ${tab === key ? "border-ink bg-ink text-cream" : "border-line bg-white"}`}>{label}</Link>
        ))}
      </nav>
      {!data?.length ? (
        <Empty emoji="⭐" title="Nothing here" text={tab === "pending" ? "New reviews will wait here for your approval." : undefined} />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {data.map((r) => {
            const product = r.products as unknown as { id: string; name: string; slug: string } | null;
            return (
              <li key={r.id} className="rounded-3xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{r.author_name}</span>
                  <span className="flex" aria-label={`${r.rating} stars`}>{[1, 2, 3, 4, 5].map((i) => <PiStarFill key={i} className={i <= r.rating ? "text-sun" : "text-line"} />)}</span>
                </div>
                <p className="text-xs text-ink-soft">on {product ? <Link href={`/admin/products/${product.id}`} className="font-semibold text-leaf">{product.name}</Link> : "a deleted product"} · {formatDateTime(r.created_at)}</p>
                <p className="mt-3">{r.body}</p>
                <ActionForm action={setReviewStatus} className="mt-4 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  {r.status !== "approved" && <SubmitButton name="status" value="approved" className="btn btn-primary btn-sm" pendingText="…">✓ Approve</SubmitButton>}
                  {r.status !== "rejected" && <SubmitButton name="status" value="rejected" className="btn btn-soft btn-sm" pendingText="…">Hide</SubmitButton>}
                  <SubmitButton name="status" value="delete" className="btn btn-soft btn-sm text-tomato" pendingText="…">Delete</SubmitButton>
                </ActionForm>
                {r.status === "approved" && <Pill color="#23752e" bg="#e3f4d8">Live on the product page</Pill>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
