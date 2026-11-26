import ScrollVelocity from "@/components/motion/scroll-velocity";

export default function AnnouncementBar({ text }: { text: string }) {
  const items = [text.replace(/\s*\p{Extended_Pictographic}\uFE0F?\s*/gu, " · ").replace(/^ · | · $/g, "").trim(), "Certified organic", "No preservatives", "Pesticide-free", "Made in Lebanon"];
  return (
    <div className="bg-leaf-dark py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cream/90">
      <p className="sr-only">{items[0]}</p>
      <ScrollVelocity items={items} speed={28} separator={<span className="mx-2 inline-block size-1 rounded-full bg-sun align-middle" />} />
    </div>
  );
}
