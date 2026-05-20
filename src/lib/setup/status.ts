import { SubscriptionSetupStatus } from "@/lib/sites/types";

export type SetupStatusTone = "neutral" | "info" | "warning" | "success" | "danger";

export const SETUP_STATUS_OPTIONS = [
  SubscriptionSetupStatus.DRAFT_DEMO,
  SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED,
  SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED,
  SubscriptionSetupStatus.PAYMENT_PENDING,
  SubscriptionSetupStatus.SITE_PROVISIONING,
  SubscriptionSetupStatus.SITE_LIVE,
  SubscriptionSetupStatus.CHANGE_REQUESTED,
  SubscriptionSetupStatus.CANCELLED,
] as const;

export function setupStatusLabel(status: SubscriptionSetupStatus): string {
  switch (status) {
    case SubscriptionSetupStatus.DRAFT_DEMO:
      return "Draft Demo";
    case SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED:
      return "Review Requested";
    case SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED:
      return "Domain Details Required";
    case SubscriptionSetupStatus.PAYMENT_PENDING:
      return "Payment Pending";
    case SubscriptionSetupStatus.SITE_PROVISIONING:
      return "Provisioning";
    case SubscriptionSetupStatus.SITE_LIVE:
      return "Site Live";
    case SubscriptionSetupStatus.CHANGE_REQUESTED:
      return "Change Requested";
    case SubscriptionSetupStatus.CANCELLED:
      return "Cancelled";
    default:
      return status;
  }
}

export function setupStatusDescription(status: SubscriptionSetupStatus): string {
  switch (status) {
    case SubscriptionSetupStatus.DRAFT_DEMO:
      return "Customer is still exploring and customising demo content.";
    case SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED:
      return "Setup request submitted and waiting for initial team review.";
    case SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED:
      return "More domain information is needed before setup can continue.";
    case SubscriptionSetupStatus.PAYMENT_PENDING:
      return "Payment details/confirmation needed before provisioning starts.";
    case SubscriptionSetupStatus.SITE_PROVISIONING:
      return "Website and domain setup tasks are currently in progress.";
    case SubscriptionSetupStatus.SITE_LIVE:
      return "Website setup is complete and marked as live.";
    case SubscriptionSetupStatus.CHANGE_REQUESTED:
      return "Customer requested a change that needs follow-up.";
    case SubscriptionSetupStatus.CANCELLED:
      return "Setup request has been cancelled.";
    default:
      return "Status description unavailable.";
  }
}

export function setupStatusTone(status: SubscriptionSetupStatus): SetupStatusTone {
  switch (status) {
    case SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED:
    case SubscriptionSetupStatus.SITE_PROVISIONING:
      return "info";
    case SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED:
    case SubscriptionSetupStatus.PAYMENT_PENDING:
    case SubscriptionSetupStatus.CHANGE_REQUESTED:
      return "warning";
    case SubscriptionSetupStatus.SITE_LIVE:
      return "success";
    case SubscriptionSetupStatus.CANCELLED:
      return "danger";
    case SubscriptionSetupStatus.DRAFT_DEMO:
    default:
      return "neutral";
  }
}
