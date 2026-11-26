import { PiCheckBold, PiCheckCircleBold, PiPackageBold, PiReceiptBold, PiTruckBold, PiXBold } from "react-icons/pi";

const ICONS = {
  pending: PiReceiptBold,
  confirmed: PiCheckBold,
  preparing: PiPackageBold,
  out_for_delivery: PiTruckBold,
  delivered: PiCheckCircleBold,
  cancelled: PiXBold,
} as const;

export default function StatusIcon({ status, size = 18, className = "" }: { status: string; size?: number; className?: string }) {
  const Icon = ICONS[status as keyof typeof ICONS] ?? PiReceiptBold;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
