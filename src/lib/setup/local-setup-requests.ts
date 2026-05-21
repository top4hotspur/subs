import {
  CommunicationOption,
  DomainOption,
  LocalSetupRequest,
  SetupRequestDraft,
  SubscriptionSetupStatus,
  WebsiteTemplateSlug,
} from "@/lib/sites/types";

// Temporary browser-only mock persistence for setup requests.
// This module intentionally uses localStorage and is not production persistence.
export const LOCAL_SETUP_REQUESTS_KEY = "subs-setup-requests";

type CreateLocalSetupRequestInput = SetupRequestDraft & {
  setupTotalGbp: number;
  monthlyTotalGbp: number;
  createdAtIso?: string;
  status?: SubscriptionSetupStatus;
  id?: string;
};

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeParseRequests(raw: string | null): LocalSetupRequest[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as LocalSetupRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRequests(requests: LocalSetupRequest[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LOCAL_SETUP_REQUESTS_KEY, JSON.stringify(requests));
}

export function listLocalSetupRequests(): LocalSetupRequest[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(LOCAL_SETUP_REQUESTS_KEY);
  return safeParseRequests(raw).sort(
    (a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime(),
  );
}

export function getLocalSetupRequest(id: string): LocalSetupRequest | null {
  if (typeof window === "undefined") {
    return null;
  }
  return listLocalSetupRequests().find((request) => request.id === id) ?? null;
}

export function createLocalSetupRequest(
  input: CreateLocalSetupRequestInput,
): LocalSetupRequest {
  if (typeof window === "undefined") {
    throw new Error("Cannot create local setup requests outside browser context.");
  }

  const request: LocalSetupRequest = {
    ...input,
    id: input.id ?? generateId(),
    createdAtIso: input.createdAtIso ?? new Date().toISOString(),
    status: input.status ?? SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED,
  };

  const requests = listLocalSetupRequests();
  requests.unshift(request);
  writeRequests(requests);

  return request;
}

export function updateLocalSetupRequestStatus(
  id: string,
  status: SubscriptionSetupStatus,
): LocalSetupRequest | null {
  if (typeof window === "undefined") {
    return null;
  }

  const requests = listLocalSetupRequests();
  const next = requests.map((request) =>
    request.id === id ? { ...request, status } : request,
  );

  writeRequests(next);
  return next.find((request) => request.id === id) ?? null;
}

export function clearLocalSetupRequests(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(LOCAL_SETUP_REQUESTS_KEY);
}

function sampleRequest(
  templateSlug: WebsiteTemplateSlug,
  businessName: string,
  status: SubscriptionSetupStatus,
  domainOption: DomainOption,
  communicationOption: CommunicationOption,
  setupTotalGbp: number,
  monthlyTotalGbp: number,
): LocalSetupRequest {
  return {
    id: generateId(),
    templateSlug,
    businessName,
    domainOption,
    communicationOption,
    contactName: "Alex Morgan",
    contactEmail: "alex@example.com",
    contactPhone: "020 7000 0000",
    notes: "Sample seeded request for local admin demo.",
    createdAtIso: new Date().toISOString(),
    status,
    setupTotalGbp,
    monthlyTotalGbp,
    existingDomain:
      domainOption === DomainOption.EXISTING_DOMAIN ? "example-business.co.uk" : undefined,
    desiredDomain:
      domainOption === DomainOption.WE_REGISTER_DOMAIN
        ? `${templateSlug}-demo.co.uk`
        : undefined,
  };
}

export function seedLocalSetupRequests(): LocalSetupRequest[] {
  if (typeof window === "undefined") {
    return [];
  }

  const existing = listLocalSetupRequests();
  if (existing.length > 0) {
    return existing;
  }

  const seeded: LocalSetupRequest[] = [
    sampleRequest(
      "taxi",
      "MetroCab Private Hire",
      SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED,
      DomainOption.EXISTING_DOMAIN,
      CommunicationOption.EMAIL_ONLY,
      149,
      30,
    ),
    sampleRequest(
      "nail-salon",
      "Rose Blush Nails",
      SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED,
      DomainOption.WE_REGISTER_DOMAIN,
      CommunicationOption.EMAIL_AND_WHATSAPP,
      198,
      40,
    ),
    sampleRequest(
      "cleaners",
      "PrimeClean Services",
      SubscriptionSetupStatus.PAYMENT_PENDING,
      DomainOption.CUSTOMER_BUYS_DOMAIN,
      CommunicationOption.EMAIL_ONLY,
      149,
      30,
    ),
  ];

  writeRequests(seeded);
  return seeded;
}
