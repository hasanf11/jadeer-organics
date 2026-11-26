import Image from "next/image";

/** The round Ja'deer badge with the wordmark beside it. */
export default function Logo({
  compact = false,
  className = "",
  light = false,
  locale = "en",
}: {
  compact?: boolean;
  className?: string;
  light?: boolean;
  locale?: "en" | "ar";
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image src="/brand/logo-source.png" alt="" width={150} height={150} priority className="size-10 shrink-0 rounded-full ring-2 ring-sun/70 md:size-11" />
      {!compact && (
        <span className="flex flex-col leading-none">
          {locale === "ar" ? (
            <>
              <span className={`font-display text-[1.55rem] font-bold leading-none ${light ? "text-cream" : "text-leaf-dark"}`}>جدير</span>
              <span className={`mt-1 text-[0.68rem] font-bold ${light ? "text-cream/70" : "text-tomato"}`}>أورغانيكس</span>
            </>
          ) : (
            <>
              <span className={`font-display text-[1.5rem] leading-none ${light ? "text-cream" : "text-leaf-dark"}`}>ja&apos;deer</span>
              <span className={`mt-1 text-[0.56rem] font-extrabold uppercase tracking-[0.42em] ${light ? "text-cream/70" : "text-tomato"}`}>organics</span>
            </>
          )}
        </span>
      )}
    </span>
  );
}
