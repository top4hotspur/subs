import {
  FinancialSummary,
  LocalAnalyticsSummary,
  ServicePerformanceSummary,
  StaffWorkloadSummary,
} from "@/lib/analytics/analytics-types";
import {
  CustomerRequest,
  CustomerRequestStatus,
} from "@/lib/requests/request-types";
import { SiteServiceItem } from "@/lib/sites/site-settings-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { StaffMember } from "@/lib/staff/staff-types";

type BuildLocalAnalyticsSummaryOptions = {
  industrySlug?: WebsiteTemplateSlug;
  requests: CustomerRequest[];
  services?: SiteServiceItem[];
  staffMembers?: StaffMember[];
};

function parsePriceLabelToGbp(priceLabel?: string): number {
  if (!priceLabel) return 0;
  const match = priceLabel.match(/GBP\s*(\d+(?:\.\d+)?)|\u00A3\s*(\d+(?:\.\d+)?)/i);
  if (!match) return 0;
  const parsed = Number.parseFloat(match[1] ?? match[2]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function requestEstimatedValue(request: CustomerRequest, servicesMap: Map<string, SiteServiceItem>): number {
  if (typeof request.finalPriceGbp === "number") return request.finalPriceGbp;
  if (typeof request.quotedPriceGbp === "number") return request.quotedPriceGbp;

  if (request.serviceId) {
    const service = servicesMap.get(request.serviceId);
    const fromService = parsePriceLabelToGbp(service?.priceLabel);
    if (fromService > 0) return fromService;
  }

  return 0;
}

export function buildLocalAnalyticsSummary(
  options: BuildLocalAnalyticsSummaryOptions,
): LocalAnalyticsSummary {
  const filteredRequests = options.industrySlug
    ? options.requests.filter((request) => request.templateSlug === options.industrySlug)
    : options.requests;

  const servicesMap = new Map<string, SiteServiceItem>();
  (options.services ?? []).forEach((service) => servicesMap.set(service.id, service));

  const valuesByRequest = filteredRequests.map((request) => ({
    request,
    value: requestEstimatedValue(request, servicesMap),
  }));

  const totalRequests = filteredRequests.length;
  const submittedRequests = filteredRequests.filter((request) => request.status === CustomerRequestStatus.SUBMITTED).length;
  const confirmedRequests = filteredRequests.filter((request) => request.status === CustomerRequestStatus.CONFIRMED || request.status === CustomerRequestStatus.STAFF_ALLOCATED).length;
  const completedRequests = filteredRequests.filter((request) => request.status === CustomerRequestStatus.COMPLETED).length;
  const cancelledRequests = filteredRequests.filter((request) => request.status === CustomerRequestStatus.CANCELLED).length;
  const noShowRequests = filteredRequests.filter((request) => request.status === CustomerRequestStatus.NO_SHOW).length;

  const completedValues = valuesByRequest.filter((item) => item.request.status === CustomerRequestStatus.COMPLETED);
  const confirmedValues = valuesByRequest.filter((item) => item.request.status === CustomerRequestStatus.CONFIRMED || item.request.status === CustomerRequestStatus.STAFF_ALLOCATED || item.request.status === CustomerRequestStatus.COMPLETED);

  const estimatedGrossIncomeGbp = valuesByRequest.reduce((sum, item) => sum + item.value, 0);
  const confirmedIncomeGbp = confirmedValues.reduce((sum, item) => sum + item.value, 0);
  const completedIncomeGbp = completedValues.reduce((sum, item) => sum + item.value, 0);
  const unpaidOrPendingGbp = Math.max(estimatedGrossIncomeGbp - completedIncomeGbp, 0);

  const financialSummary: FinancialSummary = {
    estimatedGrossIncomeGbp,
    confirmedIncomeGbp,
    completedIncomeGbp,
    unpaidOrPendingGbp,
    requestCount: totalRequests,
    completedCount: completedRequests,
  };

  const servicesAccumulator = new Map<string, ServicePerformanceSummary>();
  valuesByRequest.forEach(({ request, value }) => {
    const key = request.serviceName || request.serviceId || "Unknown service";
    const current = servicesAccumulator.get(key) ?? {
      serviceName: key,
      requestCount: 0,
      completedCount: 0,
      estimatedIncomeGbp: 0,
    };
    current.requestCount += 1;
    if (request.status === CustomerRequestStatus.COMPLETED) {
      current.completedCount += 1;
    }
    current.estimatedIncomeGbp += value;
    servicesAccumulator.set(key, current);
  });

  const topServices = Array.from(servicesAccumulator.values()).sort(
    (a, b) => b.requestCount - a.requestCount || b.estimatedIncomeGbp - a.estimatedIncomeGbp,
  );

  const knownStaffNames = new Set((options.staffMembers ?? []).map((member) => member.displayName));
  const staffAccumulator = new Map<string, StaffWorkloadSummary>();

  valuesByRequest.forEach(({ request, value }) => {
    const staffName = request.assignedStaffName || request.preferredStaffName || "Unassigned";
    if (staffName !== "Unassigned" && knownStaffNames.size > 0 && !knownStaffNames.has(staffName)) {
      // Keep unknown names visible rather than discarding them.
    }
    const current = staffAccumulator.get(staffName) ?? {
      staffName,
      assignedCount: 0,
      completedCount: 0,
      estimatedIncomeGbp: 0,
    };
    current.assignedCount += 1;
    if (request.status === CustomerRequestStatus.COMPLETED) {
      current.completedCount += 1;
    }
    current.estimatedIncomeGbp += value;
    staffAccumulator.set(staffName, current);
  });

  const staffWorkload = Array.from(staffAccumulator.values()).sort(
    (a, b) => b.assignedCount - a.assignedCount || b.estimatedIncomeGbp - a.estimatedIncomeGbp,
  );

  const conversionNumerator = confirmedRequests + completedRequests;
  const conversionRatePercent = totalRequests > 0
    ? Number(((conversionNumerator / totalRequests) * 100).toFixed(1))
    : undefined;

  return {
    industrySlug: options.industrySlug,
    totalRequests,
    submittedRequests,
    confirmedRequests,
    completedRequests,
    cancelledRequests,
    noShowRequests,
    conversionRatePercent,
    financialSummary,
    topServices,
    staffWorkload,
    generatedAtIso: new Date().toISOString(),
  };
}

export type DailyTrendBucket = {
  dayLabel: string;
  dateKey: string;
  total: number;
  statusCounts: Record<CustomerRequestStatus, number>;
  serviceCounts: Record<string, number>;
  staffCounts: Record<string, number>;
};

function toDateKey(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "invalid";
  return d.toISOString().slice(0, 10);
}

function toDayLabel(dateKey: string): string {
  if (dateKey === "invalid") return "Invalid";
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function emptyStatusCounts(): Record<CustomerRequestStatus, number> {
  return Object.values(CustomerRequestStatus).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<CustomerRequestStatus, number>);
}

function buildTrendBuckets(
  requests: CustomerRequest[],
  days: number,
): DailyTrendBucket[] {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - (days - 1));
  windowStart.setHours(0, 0, 0, 0);

  const seeded: Record<string, DailyTrendBucket> = {};
  for (let i = 0; i < days; i += 1) {
    const date = new Date(windowStart);
    date.setDate(windowStart.getDate() + i);
    const dateKey = date.toISOString().slice(0, 10);
    seeded[dateKey] = {
      dayLabel: toDayLabel(dateKey),
      dateKey,
      total: 0,
      statusCounts: emptyStatusCounts(),
      serviceCounts: {},
      staffCounts: {},
    };
  }

  requests.forEach((request) => {
    const dateKey = toDateKey(request.createdAtIso);
    const bucket = seeded[dateKey];
    if (!bucket) return;
    bucket.total += 1;
    bucket.statusCounts[request.status] += 1;
    if (request.serviceName) {
      bucket.serviceCounts[request.serviceName] = (bucket.serviceCounts[request.serviceName] ?? 0) + 1;
    }
    const staffName = request.assignedStaffName?.trim();
    if (staffName) {
      bucket.staffCounts[staffName] = (bucket.staffCounts[staffName] ?? 0) + 1;
    }
  });

  return Object.values(seeded).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function buildLast7DaysTrend(requests: CustomerRequest[]): DailyTrendBucket[] {
  return buildTrendBuckets(requests, 7);
}

export function buildLast30DaysTrend(requests: CustomerRequest[]): DailyTrendBucket[] {
  return buildTrendBuckets(requests, 30);
}
