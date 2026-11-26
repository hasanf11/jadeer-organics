import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { PiArrowUpRightBold, PiSignOutBold } from "react-icons/pi";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import AdminNav, { type NavCounts } from "@/components/admin/admin-nav";
import Logo from "@/components/logo";

// The admin always shows live data, so its pages may wait for the server.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Ja'deer admin" },
  robots: { index: false, follow: false },
};

async function attentionCounts(): Promise<NavCounts> {
  const supabase = await createClient();
  const now = Date.now();
  const quietSince = new Date(now - 30 * 60_000).toISOString();
  const keepSince = new Date(now - 30 * 86_400_000).toISOString();

  const [orders, messages, reviews, alerts, checkouts] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).is("handled_at", null),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("stock_alerts")
      .select("id, product_variants!inner(stock_quantity)", { count: "exact", head: true })
      .is("notified_at", null)
      .gt("product_variants.stock_quantity", 0),
    supabase
      .from("checkout_leads")
      .select("id", { count: "exact", head: true })
      .is("contacted_at", null)
      .lte("updated_at", quietSince)
      .gte("updated_at", keepSince),
  ]);

  return {
    orders: orders.count ?? 0,
    messages: messages.count ?? 0,
    reviews: reviews.count ?? 0,
    alerts: alerts.count ?? 0,
    checkouts: checkouts.count ?? 0,
  };
}

async function Workspace({ children }: { children: ReactNode }) {
  await connection();
  const admin = await requireAdmin();
  const counts = await attentionCounts();

  return (
    <div className="min-h-dvh bg-[#f7f3ea]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-cream">
        Skip to content
      </a>
      <header className="no-print sticky top-0 z-30 flex h-[4.5rem] items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-xl md:px-6">
        <Link href="/admin" aria-label="Admin dashboard">
          <Logo />
        </Link>
        <span className="hidden rounded-full bg-mint px-3 py-1 text-xs font-bold uppercase tracking-wider text-leaf-dark sm:inline">Admin</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-sm font-semibold text-ink-soft md:inline">Hi, {admin.displayName} 👋</span>
          <Link href="/" target="_blank" className="btn btn-soft btn-sm">
            View shop <PiArrowUpRightBold />
          </Link>
          <form action={logout}>
            <button type="submit" className="icon-btn" aria-label="Sign out" title="Sign out">
              <PiSignOutBold size={20} />
            </button>
          </form>
        </div>
      </header>
      <div className="flex">
        <AdminNav counts={counts} />
        <main id="admin-main" className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 lg:pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p role="status" className="p-8 text-ink-soft">Checking administrator access…</p>}>
      <Workspace>{children}</Workspace>
    </Suspense>
  );
}
