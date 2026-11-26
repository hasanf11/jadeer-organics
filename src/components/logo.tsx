import Image from "next/image";

/** The round Ja'deer badge with the wordmark beside it. */
export default function Logo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/brand/logo-source.png"
        alt=""
        width={150}
        height={150}
        priority
        className="size-11 shrink-0 rounded-full shadow-[0_0_0_3px_#fff,0_0_0_5px_var(--color-sun)] md:size-12"
      />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.45rem] font-extrabold tracking-tight text-brown">
            ja&apos;deer
          </span>
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.32em] text-leaf">
            organics
          </span>
        </span>
      )}
    </span>
  );
}
