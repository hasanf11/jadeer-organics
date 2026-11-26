export const BADGES = {
  organic: { label: "Organic", emoji: "🌱", color: "#23752e", bg: "#e3f4d8" },
  keto: { label: "Keto", emoji: "🥑", color: "#0b6e70", bg: "#d8f2f0" },
  vegan: { label: "Vegan", emoji: "🌿", color: "#356e1e", bg: "#e8f5d6" },
  "sugar-free": { label: "Sugar-free", emoji: "🍬", color: "#a3245c", bg: "#fde2ef" },
  "gluten-free": { label: "Gluten-free", emoji: "🌾", color: "#8a5a00", bg: "#fff0c7" },
  "preservative-free": { label: "No preservatives", emoji: "✨", color: "#b0390a", bg: "#ffe6d5" },
  "cold-pressed": { label: "Cold-pressed", emoji: "🫒", color: "#4d6324", bg: "#eef3d6" },
  local: { label: "Made in Lebanon", emoji: "🇱🇧", color: "#a91b1b", bg: "#fde4e4" },
  raw: { label: "Raw", emoji: "🍎", color: "#8a2f10", bg: "#ffedd5" },
  new: { label: "New", emoji: "🆕", color: "#5b21b6", bg: "#ede4ff" },
  bestseller: { label: "Bestseller", emoji: "⭐", color: "#8a5200", bg: "#fef3c7" },
} as const;

export type BadgeKey = keyof typeof BADGES;

export const BADGE_KEYS = Object.keys(BADGES) as BadgeKey[];

export function isBadge(value: string): value is BadgeKey {
  return value in BADGES;
}

export const ART_SHAPES = [
  "bottle",
  "tall-bottle",
  "jar",
  "tin",
  "squeeze",
  "pump",
  "tube",
  "box",
  "pouch",
  "sachet",
] as const;

export type ArtShape = (typeof ART_SHAPES)[number];
