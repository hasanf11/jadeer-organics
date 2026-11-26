import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="font-display text-[7rem] leading-none text-leaf">404</p>
        <h1 className="mt-3 text-3xl">Page not found</h1>
        <Link href="/" className="btn btn-primary mt-6">Back to Ja&apos;deer</Link>
      </div>
    </main>
  );
}
