import { CustomerRequestStatus } from "@/lib/requests/request-types";
import {
  customerRequestStatusLabel,
  customerRequestStatusTone,
} from "@/lib/ui/display-labels";

type RequestStatusBadgeProps = {
  status: CustomerRequestStatus;
  compact?: boolean;
};

const toneClasses: Record<string, string> = {
  info: "border-sky-300 bg-sky-100 text-sky-700",
  warning: "border-amber-300 bg-amber-100 text-amber-800",
  success: "border-emerald-300 bg-emerald-100 text-emerald-800",
  danger: "border-rose-300 bg-rose-100 text-rose-700",
};

export function RequestStatusBadge({ status, compact = false }: RequestStatusBadgeProps) {
  const tone = customerRequestStatusTone(status);

  return (
    <span
      className={`inline-flex rounded-full border font-semibold ${compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"} ${toneClasses[tone]}`}
    >
      {customerRequestStatusLabel(status)}
    </span>
  );
}

