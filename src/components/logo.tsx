import Image from "next/image";

/** The round Ja'deer badge with the wordmark beside it. */
export default function Logo({ compact = false, className = "", light = false }: { compact?: boolean; className?: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image src="/brand/logo-source.png" alt="" width={150} height={150} priority className="size-10 shrink-0 rounded-full md:size-11" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={`font-display text-[1.45rem] font-medium tracking-[-0.02em] ${light ? "text-cream" : "text-brown"}`}>ja&apos;deer</span>
          <span className={`mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.42em] ${light ? "text-cream/70" : "text-ink-soft"}`}>organics</span>
        </span>
      )}
    </span>
  );
}
