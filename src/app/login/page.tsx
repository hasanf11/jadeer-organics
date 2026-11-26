import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/login-form";
import Logo from "@/components/logo";
import { getCurrentAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

async function LoginContent() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-cream p-4">
      <div aria-hidden="true" className="absolute -left-32 -top-32 size-96 rounded-full bg-mint blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -right-32 size-96 rounded-full bg-pink blur-3xl" />
      <section className="relative w-full max-w-md rounded-[2rem] bg-white p-7 shadow-pop md:p-9" aria-labelledby="login-title">
        <Link href="/" aria-label="Ja'deer Organics home"><Logo /></Link>
        <p className="eyebrow mt-8">Shop administration</p>
        <h1 id="login-title" className="mt-1 text-4xl">Welcome back 🌿</h1>
        <p className="mb-6 mt-2 text-ink-soft">Sign in to manage orders, products and your shop.</p>
        <Suspense fallback={<p role="status" className="text-ink-soft">Checking your session…</p>}>
          <LoginContent />
        </Suspense>
        <Link href="/" className="mt-6 inline-block text-sm font-bold text-ink-soft hover:text-ink">← Back to the shop</Link>
      </section>
    </main>
  );
}
