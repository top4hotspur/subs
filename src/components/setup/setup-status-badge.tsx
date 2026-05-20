import { setupStatusLabel, setupStatusTone } from "@/lib/setup/status";
import { SubscriptionSetupStatus } from "@/lib/sites/types";

type SetupStatusBadgeProps = {
  status: SubscriptionSetupStatus;
};

const toneClasses: Record<string, string> = {
  neutral: "border-slate-300 bg-slate-100 text-slate-700",
  info: "border-sky-300 bg-sky-100 text-sky-700",
  warning: "border-amber-300 bg-amber-100 text-amber-800",
  success: "border-emerald-300 bg-emerald-100 text-emerald-800",
  danger: "border-rose-300 bg-rose-100 text-rose-700",
};

export function SetupStatusBadge({ status }: SetupStatusBadgeProps) {
  const tone = setupStatusTone(status);

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {setupStatusLabel(status)}
    </span>
  );
}
