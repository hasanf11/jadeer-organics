import Link from "next/link";
import { PiCompassBold } from "react-icons/pi";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t, href } = await getI18n();
  return (
    <div className="container-x grid place-items-center py-20 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-butter text-tomato">
        <PiCompassBold size={36} aria-hidden="true" />
      </span>
      <p className="mt-6 font-display text-7xl text-leaf">404</p>
      <h1 className="mt-3 text-3xl">{t.notFound.title}</h1>
      <p className="mt-2 text-ink-soft">{t.notFound.text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={href("/")} className="btn btn-primary">{t.notFound.home}</Link>
        <Link href={href("/shop")} className="btn btn-soft">{t.notFound.shop}</Link>
      </div>
    </div>
  );
}
