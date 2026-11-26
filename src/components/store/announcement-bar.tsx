import ScrollVelocity from "@/components/motion/scroll-velocity";

export default function AnnouncementBar({ text }: { text: string }) {
  const items = [text, "100% organic", "Preservative-free", "Pesticide-free", "Made with love in Lebanon"];
  return (
    <div className="bg-leaf py-2 text-sm font-bold text-white">
      <p className="sr-only">{text}</p>
      <ScrollVelocity items={items} speed={35} separator="🌿" />
    </div>
  );
}
