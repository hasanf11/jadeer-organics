import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x grid place-items-center py-20 text-center">
      <p className="font-display text-[8rem] font-extrabold leading-none text-leaf">4🥑4</p>
      <h1 className="mt-4 text-3xl">This page went out of stock</h1>
      <p className="mt-2 text-ink-soft">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">Back home</Link>
        <Link href="/shop" className="btn btn-soft">Browse the shop</Link>
      </div>
    </div>
  );
}
