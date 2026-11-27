import { getCurrentAdmin } from "@/lib/auth";
import { productWorkbook } from "@/lib/product-sheet";
import { createClient } from "@/lib/supabase/server";

/** An empty products spreadsheet, ready to fill in. */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return new Response("Not allowed", { status: 403 });

  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("name, name_ar").order("sort_order");
  const buffer = await productWorkbook([], categories ?? []);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="jadeer-products-template.xlsx"',
      "Cache-Control": "private, no-store",
    },
  });
}
