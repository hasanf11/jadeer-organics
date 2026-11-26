"use client";

import { useSearchParams } from "next/navigation";
import Confetti from "@/components/motion/confetti";

export default function OrderCelebration() {
  const params = useSearchParams();
  return params.get("placed") === "1" ? <Confetti /> : null;
}
