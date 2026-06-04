import type {
  PersistedCustomerSiteServiceCategory,
  PersistedCustomerSiteService,
  PersistedCustomerSiteSettings,
} from "@/lib/sites/admin-site-settings-client";
import type {
  CustomerSiteStaffMemberInput,
  CustomerSiteStaffMemberRecord,
  CustomerSiteStaffRoleInput,
  CustomerSiteStaffRoleRecord,
} from "@/lib/sites/customer-site-staff-types";
import type {
  CustomerSiteSchedulingSnapshot,
  CustomerSiteBusinessClosureInput,
  CustomerSiteStaffBreakWindowInput,
  CustomerSiteStaffHolidayInput,
  CustomerSiteStaffRotaDayInput,
} from "@/lib/sites/customer-site-scheduling-types";
import type { CustomerSiteBookingRecord } from "@/lib/sites/customer-site-booking-types";
import type { CustomerSiteAvailabilityResult } from "@/lib/sites/customer-site-availability";
import type {
  CustomerSiteGiftVoucherRecord,
  CustomerSiteGiftVoucherSettings,
  VoucherEmailDeliveryStatus,
} from "@/lib/sites/customer-site-voucher-types";

type ClientFailure = {
  ok: false;
  error: string;
  status: number;
  details?: unknown;
};

type ClientSuccess<T> = { ok: true } & T;
type ClientResult<T> = ClientSuccess<T> | ClientFailure;

export type SiteAdminCrmCustomer = {
  id: string | null;
  name: string;
  email: string;
  phone: string | null;
  marketingOptIn: boolean;
  marketingOptInAt: string | null;
  crmNotes: string | null;
  accountCreated: boolean;
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  lastBookingDate: string | null;
  nextBookingDate: string | null;
  lastContactEnquiryDate: string | null;
  lapsedCandidate: boolean;
  statusLabel: string;
  bookings: Array<{
    id: string;
    serviceName: string | null;
    staffName: string | null;
    preferredDate: string | null;
    preferredTime: string | null;
    status: string;
    paymentStatus: string | null;
    detailHref: string;
  }>;
  enquiries: Array<{
    id: string;
    purpose: string;
    message: string;
    status: string;
    createdAt: string;
  }>;
};

export type SiteAdminCrmEnquiry = {
  id: string;
  purpose: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  bookingId: string | null;
  emailStatus: string | null;
  createdAt: string;
};

export type SiteAdminCustomerCampaign = {
  id: string;
  title: string;
  subject: string;
  body: string;
  campaignType: string;
  status: string;
  audienceType: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  counts: {
    sent: number;
    failed: number;
    skipped: number;
    total: number;
  };
  recipients: Array<{
    id: string;
    email: string;
    name: string | null;
    status: string;
    sentAt: string | null;
    failureReason: string | null;
    createdAt: string;
  }>;
};

export type SiteAdminCustomerCampaignInput = {
  title: string;
  subject: string;
  body: string;
  campaignType: string;
  audienceType: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

export type SiteAdminCustomerCampaignSendResult = {
  ok: boolean;
  error?: string;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  details: Array<{ customerId: string; email: string; outcome: "SENT" | "SKIPPED" | "FAILED"; reason?: string }>;
};

export type SiteAdminPaymentProviderConnection = {
  id: string;
  tenantSiteId: string;
  provider: string;
  connectionMode: string;
  environment: string;
  providerAccountId: string | null;
  providerAccountName: string | null;
  providerAccountEmail: string | null;
  publicEnabled: boolean;
  connectionStatus: string;
  connectedAt: string | null;
  disconnectedAt: string | null;
  lastVerifiedAt: string | null;
  setupNotes: string | null;
  secureSecretRef: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SiteAdminStripeDiagnostics = {
  stripeSecretKeyConfigured: boolean;
  stripeAccountLinksConfigured: boolean;
  stripeTenantWebhookSecretConfigured: boolean;
  nextPublicSiteUrlConfigured: boolean;
  connectedAccountId: string | null;
  chargesEnabled: boolean;
  publicEnabled: boolean;
  checkoutReady: boolean;
};

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function getSiteAdminSettings(
  siteSlug: string,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings | null }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/settings`);
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings | null; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SETTINGS_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings ?? null };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function patchSiteAdminSettings(
  siteSlug: string,
  input: Partial<Omit<PersistedCustomerSiteSettings, "id" | "tenantSiteId" | "createdAt" | "updatedAt">>,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.settings) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SETTINGS_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getSiteAdminPaymentProviderConnections(
  siteSlug: string,
): Promise<ClientResult<{ connections: SiteAdminPaymentProviderConnection[]; stripeDiagnostics: SiteAdminStripeDiagnostics | null }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/payments/provider-connections`);
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; connections?: SiteAdminPaymentProviderConnection[]; error?: string; details?: unknown }
      & { stripeDiagnostics?: SiteAdminStripeDiagnostics | null }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.connections)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_PAYMENT_CONNECTIONS_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, connections: body.connections, stripeDiagnostics: body.stripeDiagnostics ?? null };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function saveSiteAdminPaymentProviderConnection(
  siteSlug: string,
  input: Partial<SiteAdminPaymentProviderConnection> & { provider: string },
): Promise<ClientResult<{ connections: SiteAdminPaymentProviderConnection[]; stripeDiagnostics: SiteAdminStripeDiagnostics | null }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/payments/provider-connections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; connections?: SiteAdminPaymentProviderConnection[]; error?: string; details?: unknown }
      & { stripeDiagnostics?: SiteAdminStripeDiagnostics | null }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.connections)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_PAYMENT_CONNECTION_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, connections: body.connections, stripeDiagnostics: body.stripeDiagnostics ?? null };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function startSiteAdminPaymentProviderConnect(
  siteSlug: string,
  provider: "stripe" | "square",
): Promise<ClientResult<{ redirectUrl?: string; message?: string }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/payments/${provider}/connect/start`, {
      method: "POST",
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; redirectUrl?: string; message?: string; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_PAYMENT_CONNECT_START_FAILED",
        status: response.status,
        details: body?.message ?? body?.details,
      };
    }
    return { ok: true, redirectUrl: body.redirectUrl, message: body.message };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getSiteAdminServices(
  siteSlug: string,
): Promise<ClientResult<{ services: PersistedCustomerSiteService[]; categories: PersistedCustomerSiteServiceCategory[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/services`);
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          services?: PersistedCustomerSiteService[];
          categories?: PersistedCustomerSiteServiceCategory[];
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.services)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SERVICES_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, services: body.services, categories: body.categories ?? [] };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function putSiteAdminServices(
  siteSlug: string,
  services: Array<
    Omit<PersistedCustomerSiteService, "tenantSiteId" | "createdAt" | "updatedAt" | "id"> & {
      id?: string;
    }
  >,
  categories: Array<
    Omit<PersistedCustomerSiteServiceCategory, "tenantSiteId" | "createdAt" | "updatedAt" | "id"> & {
      id?: string;
    }
  > = [],
): Promise<ClientResult<{ services: PersistedCustomerSiteService[]; categories: PersistedCustomerSiteServiceCategory[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/services`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ services, categories }),
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          services?: PersistedCustomerSiteService[];
          categories?: PersistedCustomerSiteServiceCategory[];
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.services)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SERVICES_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, services: body.services, categories: body.categories ?? [] };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function listSiteAdminStaffRoles(
  siteSlug: string,
): Promise<ClientResult<{ roles: CustomerSiteStaffRoleRecord[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/staff-roles`);
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; roles?: CustomerSiteStaffRoleRecord[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.roles)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_STAFF_ROLES_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, roles: body.roles };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function saveSiteAdminStaffRoles(
  siteSlug: string,
  roles: CustomerSiteStaffRoleInput[],
): Promise<ClientResult<{ roles: CustomerSiteStaffRoleRecord[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/staff-roles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles }),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; roles?: CustomerSiteStaffRoleRecord[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.roles)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_STAFF_ROLES_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, roles: body.roles };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function listSiteAdminStaff(
  siteSlug: string,
): Promise<ClientResult<{ staff: CustomerSiteStaffMemberRecord[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/staff`);
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; staff?: CustomerSiteStaffMemberRecord[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.staff)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_STAFF_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, staff: body.staff };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function saveSiteAdminStaff(
  siteSlug: string,
  staff: CustomerSiteStaffMemberInput[],
): Promise<ClientResult<{ staff: CustomerSiteStaffMemberRecord[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/staff`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff }),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; staff?: CustomerSiteStaffMemberRecord[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.staff)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_STAFF_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, staff: body.staff };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function updateSiteAdminStaffAccess(
  siteSlug: string,
  staffId: string,
  action: "generate" | "enable" | "disable",
): Promise<ClientResult<{
  staff: CustomerSiteStaffMemberRecord;
  accessCode: string | null;
  staffLoginUrl: string;
}>> {
  try {
    const response = await fetch(
      `/api/site-admin/${encodeURIComponent(siteSlug)}/staff/${encodeURIComponent(staffId)}/access`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      },
    );
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          staff?: CustomerSiteStaffMemberRecord;
          accessCode?: string | null;
          staffLoginUrl?: string;
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !body.staff) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_STAFF_ACCESS_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return {
      ok: true,
      staff: body.staff,
      accessCode: body.accessCode ?? null,
      staffLoginUrl: body.staffLoginUrl ?? `/site-staff/${encodeURIComponent(siteSlug)}`,
    };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getSiteAdminVouchers(
  siteSlug: string,
): Promise<ClientResult<{ settings: CustomerSiteGiftVoucherSettings; vouchers: CustomerSiteGiftVoucherRecord[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/vouchers`);
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          settings?: CustomerSiteGiftVoucherSettings;
          vouchers?: CustomerSiteGiftVoucherRecord[];
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !body.settings || !Array.isArray(body.vouchers)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_VOUCHERS_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings, vouchers: body.vouchers };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function saveSiteAdminVoucherSettings(
  siteSlug: string,
  settings: CustomerSiteGiftVoucherSettings,
): Promise<ClientResult<{ settings: CustomerSiteGiftVoucherSettings }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/vouchers/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: CustomerSiteGiftVoucherSettings; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.settings) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_VOUCHER_SETTINGS_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function runSiteAdminVoucherAction(
  siteSlug: string,
  voucherId: string,
  action: "MARK_PAYMENT_RECEIVED" | "MARK_REDEEMED" | "CANCEL" | "MARK_EXPIRED" | "RESEND_EMAIL",
): Promise<ClientResult<{ voucher: CustomerSiteGiftVoucherRecord; emailStatus?: VoucherEmailDeliveryStatus }>> {
  try {
    const response = await fetch(
      `/api/site-admin/${encodeURIComponent(siteSlug)}/vouchers/${encodeURIComponent(voucherId)}/action`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      },
    );
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          voucher?: CustomerSiteGiftVoucherRecord;
          emailStatus?: VoucherEmailDeliveryStatus;
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !body.voucher) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_VOUCHER_ACTION_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, voucher: body.voucher, emailStatus: body.emailStatus };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getSiteAdminScheduling(
  siteSlug: string,
): Promise<ClientResult<{ scheduling: CustomerSiteSchedulingSnapshot }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/scheduling`);
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; scheduling?: CustomerSiteSchedulingSnapshot; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.scheduling) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SCHEDULING_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, scheduling: body.scheduling };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function saveSiteAdminScheduling(
  siteSlug: string,
  snapshot: {
    rotaDays: CustomerSiteStaffRotaDayInput[];
    breakWindows: CustomerSiteStaffBreakWindowInput[];
    businessClosures: CustomerSiteBusinessClosureInput[];
    staffHolidays: CustomerSiteStaffHolidayInput[];
  },
): Promise<ClientResult<{ scheduling: CustomerSiteSchedulingSnapshot }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/scheduling`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; scheduling?: CustomerSiteSchedulingSnapshot; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.scheduling) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_SCHEDULING_SAVE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, scheduling: body.scheduling };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function listSiteAdminBookings(
  siteSlug: string,
  take = 20,
): Promise<ClientResult<{ bookings: CustomerSiteBookingRecord[] }>> {
  try {
    const response = await fetch(
      `/api/site-admin/${encodeURIComponent(siteSlug)}/bookings?take=${encodeURIComponent(String(take))}`,
    );
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; bookings?: CustomerSiteBookingRecord[]; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.bookings)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_BOOKINGS_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, bookings: body.bookings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getSiteAdminCrm(
  siteSlug: string,
): Promise<ClientResult<{ customers: SiteAdminCrmCustomer[]; enquiries: SiteAdminCrmEnquiry[] }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/crm`);
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          customers?: SiteAdminCrmCustomer[];
          enquiries?: SiteAdminCrmEnquiry[];
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.customers) || !Array.isArray(body.enquiries)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_CRM_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, customers: body.customers, enquiries: body.enquiries };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function patchSiteAdminCrmCustomer(
  siteSlug: string,
  input: {
    email: string;
    crmNotes?: string | null;
    suppressMarketing?: boolean;
  },
): Promise<ClientResult<{ customer: Pick<SiteAdminCrmCustomer, "id" | "email" | "marketingOptIn" | "marketingOptInAt" | "crmNotes"> }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/crm`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          customer?: Pick<SiteAdminCrmCustomer, "id" | "email" | "marketingOptIn" | "marketingOptInAt" | "crmNotes">;
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !body.customer) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_CRM_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, customer: body.customer };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getSiteAdminCustomerCampaigns(
  siteSlug: string,
): Promise<ClientResult<{ campaigns: SiteAdminCustomerCampaign[]; emailConfigured: boolean }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/customer-campaigns`);
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          campaigns?: SiteAdminCustomerCampaign[];
          emailConfigured?: boolean;
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.campaigns)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_CUSTOMER_CAMPAIGNS_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, campaigns: body.campaigns, emailConfigured: Boolean(body.emailConfigured) };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function createSiteAdminCustomerCampaign(
  siteSlug: string,
  input: SiteAdminCustomerCampaignInput,
): Promise<ClientResult<{ campaigns: SiteAdminCustomerCampaign[]; emailConfigured: boolean }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/customer-campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          campaigns?: SiteAdminCustomerCampaign[];
          emailConfigured?: boolean;
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.campaigns)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_CUSTOMER_CAMPAIGN_CREATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, campaigns: body.campaigns, emailConfigured: Boolean(body.emailConfigured) };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function updateSiteAdminCustomerCampaign(
  siteSlug: string,
  campaignId: string,
  input: Partial<SiteAdminCustomerCampaignInput> & { status?: "DRAFT" | "READY" | "CANCELLED" },
): Promise<ClientResult<{ campaigns: SiteAdminCustomerCampaign[]; emailConfigured: boolean }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/customer-campaigns/${encodeURIComponent(campaignId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "UPDATE", ...input }),
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          campaigns?: SiteAdminCustomerCampaign[];
          emailConfigured?: boolean;
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.campaigns)) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_CUSTOMER_CAMPAIGN_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, campaigns: body.campaigns, emailConfigured: Boolean(body.emailConfigured) };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function sendSiteAdminCustomerCampaign(
  siteSlug: string,
  campaignId: string,
  selectedCustomerIds: string[] = [],
): Promise<ClientResult<{
  campaigns: SiteAdminCustomerCampaign[];
  emailConfigured: boolean;
  sendResult: SiteAdminCustomerCampaignSendResult;
}>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/customer-campaigns/${encodeURIComponent(campaignId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "SEND", selectedCustomerIds }),
    });
    const body = (await parseJsonSafe(response)) as
      | {
          ok?: boolean;
          campaigns?: SiteAdminCustomerCampaign[];
          emailConfigured?: boolean;
          sendResult?: SiteAdminCustomerCampaignSendResult;
          error?: string;
          details?: unknown;
        }
      | null;
    if (!response.ok || !body?.ok || !Array.isArray(body.campaigns) || !body.sendResult) {
      return {
        ok: false,
        error: body?.error ?? body?.sendResult?.error ?? "SITE_ADMIN_CUSTOMER_CAMPAIGN_SEND_FAILED",
        status: response.status,
        details: body?.details ?? body?.sendResult,
      };
    }
    return {
      ok: true,
      campaigns: body.campaigns,
      emailConfigured: Boolean(body.emailConfigured),
      sendResult: body.sendResult,
    };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function updateSiteAdminBookingStatus(
  siteSlug: string,
  input: {
    bookingId: string;
    status: CustomerSiteBookingRecord["status"];
    paymentStatus?: CustomerSiteBookingRecord["paymentStatus"];
    refundStatus?: CustomerSiteBookingRecord["refundStatus"];
    refundGuidance?: string | null;
    cancellationReason?: string | null;
    refundAction?: "CANCEL_ONLY" | "MANUAL_REFUND_HANDLED" | "NO_REFUND";
    notes?: string | null;
  },
): Promise<ClientResult<{ booking: CustomerSiteBookingRecord }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/bookings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; booking?: CustomerSiteBookingRecord; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.booking) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_BOOKING_STATUS_UPDATE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, booking: body.booking };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function amendSiteAdminBooking(
  siteSlug: string,
  input: {
    bookingId: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    notes?: string | null;
    status?: CustomerSiteBookingRecord["status"];
    serviceId?: string;
    staffMemberId?: string | null;
    preferredDate?: string;
    preferredTime?: string;
  },
): Promise<ClientResult<{ booking: CustomerSiteBookingRecord }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/bookings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "amend", ...input }),
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; booking?: CustomerSiteBookingRecord; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.booking) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_BOOKING_AMEND_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, booking: body.booking };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function getSiteAdminAvailability(
  siteSlug: string,
  options: { serviceId: string; staffId?: string | null; date: string; excludeBookingId?: string | null },
): Promise<ClientResult<{ availability: CustomerSiteAvailabilityResult }>> {
  try {
    const params = new URLSearchParams({
      serviceId: options.serviceId,
      date: options.date,
    });
    if (options.staffId) params.set("staffId", options.staffId);
    if (options.excludeBookingId) params.set("excludeBookingId", options.excludeBookingId);
    const response = await fetch(
      `/api/site-admin/${encodeURIComponent(siteSlug)}/availability?${params.toString()}`,
    );
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; availability?: CustomerSiteAvailabilityResult; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.availability) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_AVAILABILITY_GET_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, availability: body.availability };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function uploadSiteAdminBrandingLogo(
  siteSlug: string,
  file: File,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings }>> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/branding/logo`, {
      method: "POST",
      body: formData,
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.settings) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_LOGO_UPLOAD_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function removeSiteAdminBrandingLogo(
  siteSlug: string,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings }>> {
  try {
    const response = await fetch(`/api/site-admin/${encodeURIComponent(siteSlug)}/branding/logo`, {
      method: "DELETE",
    });
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.settings) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_LOGO_DELETE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function uploadSiteAdminBrandingFavicon(
  siteSlug: string,
  file: File,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings }>> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(
      `/api/site-admin/${encodeURIComponent(siteSlug)}/branding/favicon`,
      {
        method: "POST",
        body: formData,
      },
    );
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.settings) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_FAVICON_UPLOAD_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}

export async function removeSiteAdminBrandingFavicon(
  siteSlug: string,
): Promise<ClientResult<{ settings: PersistedCustomerSiteSettings }>> {
  try {
    const response = await fetch(
      `/api/site-admin/${encodeURIComponent(siteSlug)}/branding/favicon`,
      {
        method: "DELETE",
      },
    );
    const body = (await parseJsonSafe(response)) as
      | { ok?: boolean; settings?: PersistedCustomerSiteSettings; error?: string; details?: unknown }
      | null;
    if (!response.ok || !body?.ok || !body.settings) {
      return {
        ok: false,
        error: body?.error ?? "SITE_ADMIN_FAVICON_DELETE_FAILED",
        status: response.status,
        details: body?.details,
      };
    }
    return { ok: true, settings: body.settings };
  } catch {
    return { ok: false, error: "NETWORK_ERROR", status: 0 };
  }
}
