import { WebsiteTemplateSlug } from "@/lib/sites/types";
import {
  CustomerRequest,
  CustomerRequestCommunicationChannel,
  CustomerRequestKind,
  CustomerRequestLocationType,
  CustomerRequestPricingStatus,
  CustomerRequestStatus,
} from "@/lib/requests/request-types";

export const LOCAL_CUSTOMER_REQUESTS_KEY = "subs-customer-requests";

type CreateLocalCustomerRequestInput = Omit<
  CustomerRequest,
  "id" | "createdAtIso" | "updatedAtIso" | "status" | "completionMessageSentAtIso" | "reviewRequestSentAtIso"
> & {
  status?: CustomerRequestStatus;
};

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cust_req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parse(raw: string | null): CustomerRequest[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as CustomerRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(requests: CustomerRequest[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LOCAL_CUSTOMER_REQUESTS_KEY, JSON.stringify(requests));
}

export function listLocalCustomerRequests(): CustomerRequest[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(LOCAL_CUSTOMER_REQUESTS_KEY);
  return parse(raw).sort(
    (a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime(),
  );
}

export function getLocalCustomerRequest(id: string): CustomerRequest | null {
  return listLocalCustomerRequests().find((request) => request.id === id) ?? null;
}

export function createLocalCustomerRequest(
  input: CreateLocalCustomerRequestInput,
): CustomerRequest {
  if (typeof window === "undefined") {
    throw new Error("Cannot create local customer request outside browser context.");
  }
  const now = new Date().toISOString();
  const request: CustomerRequest = {
    ...input,
    id: generateId(),
    status: input.status ?? CustomerRequestStatus.SUBMITTED,
    createdAtIso: now,
    updatedAtIso: now,
  };

  const requests = listLocalCustomerRequests();
  requests.unshift(request);
  write(requests);
  return request;
}

export function updateLocalCustomerRequestStatus(
  id: string,
  status: CustomerRequestStatus,
): CustomerRequest | null {
  const now = new Date().toISOString();
  const requests = listLocalCustomerRequests().map((request) => {
    if (request.id !== id) {
      return request;
    }
    const next: CustomerRequest = { ...request, status, updatedAtIso: now };
    if (status === CustomerRequestStatus.COMPLETED) {
      next.completionMessageSentAtIso = next.completionMessageSentAtIso ?? now;
      next.reviewRequestSentAtIso = next.reviewRequestSentAtIso ?? now;
    }
    return next;
  });
  write(requests);
  return requests.find((request) => request.id === id) ?? null;
}

export function assignLocalCustomerRequestStaff(
  id: string,
  assignment: { staffName?: string; staffId?: string },
): CustomerRequest | null {
  const now = new Date().toISOString();
  const cleanStaffName = assignment.staffName?.trim();
  const cleanStaffId = assignment.staffId?.trim();

  const requests = listLocalCustomerRequests().map((request) =>
    request.id === id
      ? {
          ...request,
          assignedStaffId: cleanStaffId || undefined,
          assignedStaffName: cleanStaffName || undefined,
          updatedAtIso: now,
          status: cleanStaffName || cleanStaffId ? CustomerRequestStatus.STAFF_ALLOCATED : request.status,
        }
      : request,
  );
  write(requests);
  return requests.find((request) => request.id === id) ?? null;
}

export function clearLocalCustomerRequests(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(LOCAL_CUSTOMER_REQUESTS_KEY);
}

function seedRequest(
  templateSlug: WebsiteTemplateSlug,
  kind: CustomerRequestKind,
  locationType: CustomerRequestLocationType,
  customerName: string,
  serviceName: string,
): CustomerRequest {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    templateSlug,
    customerName,
    customerEmail: `${customerName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    customerPhone: "020 7000 1234",
    kind,
    status: CustomerRequestStatus.REVIEWING,
    pricingStatus:
      kind === CustomerRequestKind.BOOKING_REQUEST
        ? CustomerRequestPricingStatus.PRICE_CONFIRMED
        : CustomerRequestPricingStatus.QUOTE_REQUIRED,
    serviceName,
    preferredDate: "2026-05-22",
    preferredTime: "10:00",
    locationType,
    customerAddress: locationType === CustomerRequestLocationType.CUSTOMER_ADDRESS ? "21 High Road" : undefined,
    pickupAddress: locationType === CustomerRequestLocationType.ROUTE ? "Station Road" : undefined,
    destinationAddress: locationType === CustomerRequestLocationType.ROUTE ? "Airport Terminal 3" : undefined,
    notes: "Seeded local request for demos.",
    communicationChannels: [CustomerRequestCommunicationChannel.EMAIL],
    createdAtIso: now,
    updatedAtIso: now,
  };
}

export function seedLocalCustomerRequests(): CustomerRequest[] {
  const existing = listLocalCustomerRequests();
  if (existing.length > 0) {
    return existing;
  }

  const seeded = [
    seedRequest(
      "taxi",
      CustomerRequestKind.QUOTE_REQUEST,
      CustomerRequestLocationType.ROUTE,
      "Jamie Smith",
      "Airport transfer",
    ),
    seedRequest(
      "barbers",
      CustomerRequestKind.BOOKING_REQUEST,
      CustomerRequestLocationType.BUSINESS_PREMISES,
      "Chris Green",
      "Skin fade",
    ),
    seedRequest(
      "cleaners",
      CustomerRequestKind.JOB_REQUEST,
      CustomerRequestLocationType.CUSTOMER_ADDRESS,
      "Morgan Reed",
      "End-of-tenancy clean",
    ),
  ];
  write(seeded);
  return seeded;
}

