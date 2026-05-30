import {
  CommunicationOption,
  DomainOption,
  isWebsiteTemplateSlug,
  LocalSetupRequest,
  SetupRequestDraft,
  SubscriptionSetupStatus,
} from "@/lib/sites/types";
import { BackendSetupRequestRecord } from "@/lib/setup/setup-request-backend-client";

export type SetupRequestDisplay = {
  id: string;
  templateSlug: LocalSetupRequest["templateSlug"];
  businessName: string;
  domainOption: DomainOption;
  communicationOption: CommunicationOption;
  existingDomain?: string;
  desiredDomain?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  setupTotalGbp: number;
  monthlyTotalGbp: number;
  status: SubscriptionSetupStatus;
  paymentStatus?: string;
  stripeCheckoutSessionId?: string;
  stripeSubscriptionId?: string;
  createdAtIso: string;
  source: "backend" | "local";
  demoDraftName?: string;
};

function mapDomainOption(value: string | undefined): DomainOption {
  if (value === DomainOption.CUSTOMER_BUYS_DOMAIN) return DomainOption.CUSTOMER_BUYS_DOMAIN;
  if (value === DomainOption.WE_REGISTER_DOMAIN) return DomainOption.WE_REGISTER_DOMAIN;
  return DomainOption.EXISTING_DOMAIN;
}

function mapCommunicationOption(value: string | undefined): CommunicationOption {
  if (value === CommunicationOption.EMAIL_AND_WHATSAPP) return CommunicationOption.EMAIL_AND_WHATSAPP;
  return CommunicationOption.EMAIL_ONLY;
}

function mapStatus(value: string | undefined): SubscriptionSetupStatus {
  if (value && Object.values(SubscriptionSetupStatus).includes(value as SubscriptionSetupStatus)) {
    return value as SubscriptionSetupStatus;
  }
  return SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED;
}

export function mapBackendSetupRequestToDisplay(
  request: BackendSetupRequestRecord,
): SetupRequestDisplay {
  return {
    id: request.id,
    templateSlug: isWebsiteTemplateSlug(request.industrySlug)
      ? request.industrySlug
      : "barbers",
    businessName: request.businessName,
    domainOption: mapDomainOption(request.domainOption),
    communicationOption: mapCommunicationOption(request.communicationOption),
    existingDomain: request.existingDomain ?? undefined,
    desiredDomain: request.desiredDomain ?? undefined,
    contactName: request.contactName ?? undefined,
    contactEmail: request.contactEmail ?? undefined,
    contactPhone: request.contactPhone ?? undefined,
    notes: request.notes ?? undefined,
    setupTotalGbp: request.setupTotalGbp,
    monthlyTotalGbp: request.monthlyTotalGbp,
    status: mapStatus(request.status),
    paymentStatus: request.paymentStatus ?? undefined,
    stripeCheckoutSessionId: request.stripeCheckoutSessionId ?? undefined,
    stripeSubscriptionId: request.stripeSubscriptionId ?? undefined,
    createdAtIso: request.createdAt,
    source: "backend",
  };
}

export function mapLocalSetupRequestToDisplay(
  request: LocalSetupRequest,
): SetupRequestDisplay {
  return {
    ...request,
    source: "local",
  };
}

export function mapDraftToBackendPayload(
  draft: SetupRequestDraft,
  totals: { setupTotalGbp: number; monthlyTotalGbp: number },
) {
  return {
    industrySlug: draft.templateSlug,
    businessName: draft.businessName,
    contactName: draft.contactName,
    contactEmail: draft.contactEmail,
    contactPhone: draft.contactPhone,
    domainOption: draft.domainOption,
    existingDomain: draft.existingDomain,
    desiredDomain: draft.desiredDomain,
    communicationOption: draft.communicationOption,
    setupTotalGbp: totals.setupTotalGbp,
    monthlyTotalGbp: totals.monthlyTotalGbp,
    status: SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED,
    notes: draft.notes,
    rawPayload: {
      demoDraftId: draft.demoDraftId,
      demoDraftName: draft.demoDraftName,
      submittedFrom: "setup-form",
    },
  };
}
