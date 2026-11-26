import type { ArtShape } from "@/lib/badges";

// A hand-drawn style illustration of the product's container, used until
// the shop uploads a real photo. Each product has its own colours.

type ProductArtProps = {
  shape: ArtShape;
  color: string;
  background: string;
  name: string;
  className?: string;
  showBackground?: boolean;
};

function shorten(name: string): string[] {
  const words = name.replace(/^The /, "").split(/\s+/);
  if (words.length <= 2) return [words.join(" ")];
  const middle = Math.ceil(words.length / 2);
  return [words.slice(0, middle).join(" "), words.slice(middle).join(" ")];
}

function Label({ x, y, w, h, color, name }: { x: number; y: number; w: number; h: number; color: string; name: string }) {
  const lines = shorten(name);
  const size = Math.min(13, (w / Math.max(...lines.map((l) => l.length))) * 1.7);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#fffaf0" />
      <rect x={x} y={y} width={w} height={h} rx={6} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={2} />
      <text
        x={x + w / 2}
        y={y + h * 0.3}
        textAnchor="middle"
        fontFamily="var(--font-display), sans-serif"
        fontWeight={800}
        fontSize={Math.min(16, w / 4.2)}
        fill="#4b3a39"
      >
        ja&apos;deer
      </text>
      {lines.map((line, index) => (
        <text
          key={line}
          x={x + w / 2}
          y={y + h * 0.56 + index * (size + 2)}
          textAnchor="middle"
          fontFamily="var(--font-body), sans-serif"
          fontWeight={700}
          fontSize={size}
          fill={color}
        >
          {line}
        </text>
      ))}
      <path
        d={`M${x + w / 2 - 9} ${y + h - 12} q9 -14 18 0 q-9 6 -18 0z`}
        fill={color}
        opacity={0.8}
      />
    </g>
  );
}

function Shape({ shape, color, name }: { shape: ArtShape; color: string; name: string }) {
  switch (shape) {
    case "tall-bottle":
      return (
        <g>
          <rect x={88} y={14} width={24} height={22} rx={3} fill="#3b2a26" />
          <path d="M90 36h20v30c0 10 22 18 22 40v120a10 10 0 0 1-10 10H78a10 10 0 0 1-10-10V106c0-22 22-30 22-40z" fill={color} />
          <path d="M76 110c0-12 8-20 14-24v150h-4a10 10 0 0 1-10-10z" fill="#fff" opacity={0.18} />
          <Label x={74} y={128} w={52} h={80} color={color} name={name} />
        </g>
      );
    case "bottle":
      return (
        <g>
          <rect x={87} y={28} width={26} height={20} rx={3} fill="#3b2a26" />
          <path d="M91 48h18v22c0 8 26 16 26 36v112a12 12 0 0 1-12 12H77a12 12 0 0 1-12-12V106c0-20 26-28 26-36z" fill={color} />
          <path d="M74 112c0-12 10-22 18-26v144h-6a12 12 0 0 1-12-12z" fill="#fff" opacity={0.18} />
          <Label x={70} y={126} w={60} h={76} color={color} name={name} />
        </g>
      );
    case "squeeze":
      return (
        <g>
          <path d="M84 30h32l4 18H80z" fill="#3b2a26" />
          <path d="M70 48h60c10 0 16 10 14 22l-10 150a12 12 0 0 1-12 11H78a12 12 0 0 1-12-11L56 70c-2-12 4-22 14-22z" fill={color} />
          <path d="M68 70c0-8 4-14 10-16l8 172h-6a10 10 0 0 1-10-10z" fill="#fff" opacity={0.18} />
          <Label x={68} y={110} w={64} h={82} color={color} name={name} />
        </g>
      );
    case "jar":
      return (
        <g>
          <rect x={58} y={70} width={84} height={26} rx={6} fill="#3b2a26" />
          <rect x={52} y={94} width={96} height={138} rx={18} fill={color} />
          <rect x={60} y={102} width={14} height={120} rx={7} fill="#fff" opacity={0.2} />
          <Label x={64} y={118} w={72} h={84} color={color} name={name} />
        </g>
      );
    case "tin":
      return (
        <g>
          <rect x={56} y={44} width={88} height={22} rx={6} fill="#e9e2d0" />
          <rect x={58} y={64} width={84} height={168} rx={10} fill={color} />
          <rect x={64} y={70} width={12} height={156} rx={6} fill="#fff" opacity={0.18} />
          <Label x={66} y={110} w={68} h={92} color={color} name={name} />
        </g>
      );
    case "pump":
      return (
        <g>
          <path d="M96 20h36v10h-26v24H96z" fill="#3b2a26" />
          <rect x={90} y={52} width={20} height={20} rx={3} fill="#3b2a26" />
          <rect x={62} y={72} width={76} height={160} rx={22} fill={color} />
          <rect x={70} y={82} width={12} height={140} rx={6} fill="#fff" opacity={0.2} />
          <Label x={70} y={118} w={60} h={84} color={color} name={name} />
        </g>
      );
    case "tube":
      return (
        <g>
          <rect x={84} y={200} width={32} height={34} rx={6} fill="#3b2a26" />
          <path d="M66 24h68l-6 176H72z" fill={color} />
          <rect x={64} y={20} width={72} height={12} rx={3} fill={color} />
          <path d="M74 36h10l2 160h-10z" fill="#fff" opacity={0.2} />
          <Label x={76} y={70} w={48} h={96} color={color} name={name} />
        </g>
      );
    case "box":
      return (
        <g>
          <path d="M44 84 100 60l56 24v138l-56 18-56-18z" fill={color} />
          <path d="M100 60v180l-56-18V84z" fill="#000" opacity={0.08} />
          <path d="M44 84 100 108l56-24" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} />
          <Label x={58} y={124} w={84} h={80} color={color} name={name} />
        </g>
      );
    case "pouch":
      return (
        <g>
          <path d="M60 40h80l8 30-6 160H58L52 70z" fill={color} />
          <rect x={60} y={40} width={80} height={14} fill="#000" opacity={0.12} />
          <Label x={66} y={100} w={68} h={90} color={color} name={name} />
        </g>
      );
    case "sachet":
    default:
      return (
        <g>
          <rect x={56} y={50} width={88} height={180} rx={8} fill={color} />
          <rect x={56} y={50} width={88} height={16} fill="#000" opacity={0.12} />
          <Label x={64} y={104} w={72} h={90} color={color} name={name} />
        </g>
      );
  }
}

export default function ProductArt({
  shape,
  color,
  background,
  name,
  className,
  showBackground = true,
}: ProductArtProps) {
  return (
    <svg
      viewBox="0 0 200 250"
      className={className}
      role="img"
      aria-label={name}
      preserveAspectRatio="xMidYMid meet"
    >
      {showBackground && <rect width="200" height="250" fill={background} />}
      {showBackground && (
        <>
          <circle cx="100" cy="150" r="78" fill="#fff" opacity={0.55} />
          <circle cx="162" cy="40" r="10" fill={color} opacity={0.18} />
          <circle cx="30" cy="210" r="14" fill={color} opacity={0.12} />
          <path d="M28 46c10-16 30-18 38-6-12 2-24 8-38 6z" fill="#5c9a2f" opacity={0.55} />
        </>
      )}
      <ellipse cx="100" cy="236" rx="56" ry="6" fill="#2a1c17" opacity={0.12} />
      <Shape shape={shape} color={color} name={name} />
    </svg>
  );
}
