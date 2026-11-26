import { getCurrentAdmin } from "@/lib/auth";
import { excelResponse } from "@/lib/excel";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return new Response("Not allowed", { status: 403 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("newsletter_subscribers").select("email, created_at").order("created_at", { ascending: false }).limit(10000);
  if (error) return new Response("Could not export", { status: 500 });
  return excelResponse(
    `jadeer-mailing-list-${new Date().toISOString().slice(0, 10)}.xlsx`,
    "Subscribers",
    [{ header: "Email", key: "email", width: 36 }, { header: "Joined", key: "joined", width: 20 }],
    (data ?? []).map((s) => ({ email: s.email, joined: new Date(s.created_at).toLocaleDateString("en-GB") })),
  );
}
