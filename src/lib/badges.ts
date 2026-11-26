export const BADGES = {
  organic: { label: "Organic", color: "#2e5e35", bg: "#e6eee0" },
  keto: { label: "Keto", color: "#2d6764", bg: "#e0ecea" },
  vegan: { label: "Vegan", color: "#3f6b2a", bg: "#e9efdd" },
  "sugar-free": { label: "Sugar-free", color: "#7d3a52", bg: "#f3e6ea" },
  "gluten-free": { label: "Gluten-free", color: "#7a5a1d", bg: "#f4ecd6" },
  "preservative-free": { label: "No preservatives", color: "#8f4426", bg: "#f5e7df" },
  "cold-pressed": { label: "Cold-pressed", color: "#4d5e26", bg: "#edf0dc" },
  local: { label: "Made in Lebanon", color: "#8a2f2f", bg: "#f4e4e2" },
  raw: { label: "Raw", color: "#7f3f1f", bg: "#f5e6da" },
  new: { label: "New", color: "#4b3f7a", bg: "#e9e6f2" },
  bestseller: { label: "Bestseller", color: "#6b4f16", bg: "#f2e9d2" },
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
