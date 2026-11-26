// The same arithmetic as public.create_guest_order, so the total shown at
// checkout is exactly the total the database will accept.

export type PromoKind = "percent" | "fixed" | "free_delivery";

export type AppliedPromo = {
  code: string;
  kind: PromoKind;
  value: number;
  minOrderCents: number;
  description: string;
};

export function deliveryFee(
  subtotal: number,
  zoneFee: number | null,
  freeThreshold: number,
): number {
  if (zoneFee == null) return 0;
  if (freeThreshold > 0 && subtotal >= freeThreshold) return 0;
  return zoneFee;
}

export function promoDiscount(
  promo: Pick<AppliedPromo, "kind" | "value"> | null,
  subtotal: number,
  delivery: number,
): number {
  if (!promo) return 0;
  switch (promo.kind) {
    case "percent":
      return Math.floor((subtotal * promo.value) / 100);
    case "fixed":
      return Math.min(promo.value, subtotal);
    case "free_delivery":
      return delivery;
    default:
      return 0;
  }
}

export function orderTotals({
  subtotal,
  zoneFee,
  freeThreshold,
  promo,
}: {
  subtotal: number;
  zoneFee: number | null;
  freeThreshold: number;
  promo: AppliedPromo | null;
}) {
  const delivery = deliveryFee(subtotal, zoneFee, freeThreshold);
  const promoApplies = promo != null && subtotal >= promo.minOrderCents;
  const discount = promoApplies ? promoDiscount(promo, subtotal, delivery) : 0;
  return {
    subtotal,
    delivery,
    discount,
    promoApplies,
    total: Math.max(0, subtotal + delivery - discount),
  };
}

export function describePromo(promo: Pick<AppliedPromo, "kind" | "value">): string {
  if (promo.kind === "percent") return `${promo.value}% off`;
  if (promo.kind === "fixed") return `$${(promo.value / 100).toFixed(2)} off`;
  return "Free delivery";
}
