import {
  IndustryOperationsBlueprint,
  IndustryOperationMode,
  IndustrySchedulingMode,
  PricingMode,
  StaffAllocationMode,
} from "@/lib/industry/operations-types";

type OperationsBlueprintSummaryProps = {
  blueprint: IndustryOperationsBlueprint;
  variant?: "compact" | "full";
  showPortalHighlights?: boolean;
  showAdminHighlights?: boolean;
  showLifecycle?: boolean;
};

function operationModeLabel(mode: IndustryOperationMode): string {
  switch (mode) {
    case IndustryOperationMode.BOOKING:
      return "Booking flow";
    case IndustryOperationMode.QUOTE_REQUEST:
      return "Quote request flow";
    case IndustryOperationMode.ENQUIRY:
      return "Enquiry flow";
    case IndustryOperationMode.JOB_REQUEST:
      return "Job request flow";
    case IndustryOperationMode.PRODUCT_SERVICE_SELECTION:
      return "Service selection flow";
    default:
      return "Business workflow";
  }
}

function schedulingLabel(mode: IndustrySchedulingMode): string {
  switch (mode) {
    case IndustrySchedulingMode.FIXED_TIME_SLOT:
      return "Fixed time slots";
    case IndustrySchedulingMode.FLEXIBLE_JOB_WINDOW:
      return "Flexible job windows";
    case IndustrySchedulingMode.DATE_ONLY:
      return "Date only scheduling";
    case IndustrySchedulingMode.ROUTE_BASED:
      return "Route-based scheduling";
    case IndustrySchedulingMode.LESSON_SLOT:
      return "Lesson slot scheduling";
    case IndustrySchedulingMode.NONE:
    default:
      return "No fixed scheduling";
  }
}

function pricingLabel(mode: PricingMode): string {
  switch (mode) {
    case PricingMode.FIXED_SERVICE_PRICE:
      return "Fixed service pricing";
    case PricingMode.FROM_PRICE:
      return "From pricing";
    case PricingMode.QUOTE_BASED:
      return "Quote-based pricing";
    case PricingMode.DISTANCE_TIME_BASED:
      return "Distance and time pricing";
    case PricingMode.HOURLY:
      return "Hourly pricing";
    case PricingMode.PACKAGE_BASED:
      return "Package pricing";
    default:
      return "Custom pricing";
  }
}

function staffAllocationLabel(mode: StaffAllocationMode): string {
  switch (mode) {
    case StaffAllocationMode.NOT_REQUIRED:
      return "No staff allocation needed";
    case StaffAllocationMode.CUSTOMER_SELECTS:
      return "Customer selects staff preference";
    case StaffAllocationMode.BUSINESS_ALLOCATES:
      return "Business allocates staff";
    case StaffAllocationMode.AUTO_ASSIGN_FUTURE:
      return "Future auto-assignment option";
    default:
      return "Business staff allocation";
  }
}

export function OperationsBlueprintSummary({
  blueprint,
  variant = "compact",
  showPortalHighlights = true,
  showAdminHighlights = true,
  showLifecycle = false,
}: OperationsBlueprintSummaryProps) {
  const titleClass = variant === "full" ? "text-2xl" : "text-xl";
  const panelPadding = variant === "full" ? "p-6" : "p-4";

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${panelPadding}`}>
      <h2 className={`${titleClass} font-semibold text-slate-900`}>Built around how your business works</h2>
      <p className="mt-2 text-slate-600">{blueprint.primaryCustomerFlow}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer action</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{blueprint.publicActionLabel}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operation style</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{operationModeLabel(blueprint.operationMode)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduling style</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{schedulingLabel(blueprint.schedulingMode)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing style</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{pricingLabel(blueprint.pricingMode)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Staff allocation</p>
        <p className="mt-1 text-sm font-medium text-slate-900">{staffAllocationLabel(blueprint.staffAllocationMode)}</p>
      </div>

      {(showPortalHighlights || showAdminHighlights) && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {showPortalHighlights ? (
            <article>
              <h3 className="text-sm font-semibold text-slate-900">Customer portal highlights</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {blueprint.customerPortalFeatures.slice(0, variant === "full" ? 4 : 3).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ) : null}
          {showAdminHighlights ? (
            <article>
              <h3 className="text-sm font-semibold text-slate-900">Business admin highlights</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {blueprint.businessAdminFeatures.slice(0, variant === "full" ? 5 : 3).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      )}

      {showLifecycle ? (
        <article className="mt-5">
          <h3 className="text-sm font-semibold text-slate-900">Typical lifecycle stages</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            {blueprint.jobLifecycleStages.map((stage) => (
              <li key={stage}>{stage}</li>
            ))}
          </ol>
        </article>
      ) : null}
    </section>
  );
}
