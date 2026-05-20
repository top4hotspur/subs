import { CustomerRequest, CustomerRequestStatus } from "@/lib/requests/request-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

type TimeRange = {
  startTime: string;
  endTime: string;
};

type FindStaffConflictsOptions = {
  industrySlug: WebsiteTemplateSlug;
  staffId?: string;
  date: string;
  startTime: string;
  endTime: string;
  existingRequests: CustomerRequest[];
  excludeRequestId?: string;
};

const NON_BLOCKING_STATUSES = new Set<CustomerRequestStatus>([
  CustomerRequestStatus.CANCELLED,
  CustomerRequestStatus.NO_SHOW,
]);

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function addMinutes(time: string, minutesToAdd: number): string {
  const total = toMinutes(time) + minutesToAdd;
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getAppointmentTimeRange(
  request: CustomerRequest,
  fallbackDurationMinutes = 45,
): TimeRange | null {
  if (!request.preferredTime) {
    return null;
  }

  const duration = request.estimatedDurationMinutes ?? fallbackDurationMinutes;
  return {
    startTime: request.preferredTime,
    endTime: addMinutes(request.preferredTime, duration),
  };
}

export function doTimeRangesOverlap(a: TimeRange, b: TimeRange): boolean {
  const aStart = toMinutes(a.startTime);
  const aEnd = toMinutes(a.endTime);
  const bStart = toMinutes(b.startTime);
  const bEnd = toMinutes(b.endTime);
  return aStart < bEnd && aEnd > bStart;
}

export function findStaffConflictsForSlot(
  options: FindStaffConflictsOptions,
): CustomerRequest[] {
  const { industrySlug, staffId, date, startTime, endTime, existingRequests, excludeRequestId } = options;

  if (!staffId) {
    return [];
  }

  const slot: TimeRange = { startTime, endTime };

  return existingRequests.filter((request) => {
    if (request.id === excludeRequestId) {
      return false;
    }
    if (request.templateSlug !== industrySlug) {
      return false;
    }
    if (!request.preferredDate || request.preferredDate !== date) {
      return false;
    }
    if (NON_BLOCKING_STATUSES.has(request.status)) {
      return false;
    }

    const requestStaffId = request.assignedStaffId ?? request.preferredStaffId;
    if (!requestStaffId || requestStaffId !== staffId) {
      return false;
    }

    const requestRange = getAppointmentTimeRange(request);
    if (!requestRange) {
      return false;
    }

    return doTimeRangesOverlap(slot, requestRange);
  });
}

export function isSlotBlockedByExistingRequest(options: FindStaffConflictsOptions): {
  blocked: boolean;
  blockingRequest?: CustomerRequest;
} {
  const conflicts = findStaffConflictsForSlot(options);
  return {
    blocked: conflicts.length > 0,
    blockingRequest: conflicts[0],
  };
}
