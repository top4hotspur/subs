import { prisma } from "@/lib/db/prisma";

export type CustomerSitePreviewData = {
  tenantSite: {
    id: string;
    slug: string;
    displayName: string;
    industrySlug: string | null;
    domainPrimary: string | null;
    provisioningStatus: string | null;
    createdAtIso: string;
  };
  settings: {
    siteDisplayName: string | null;
    businessName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    openingHoursSummary: string | null;
    openingHoursJson: unknown;
    heroHeadline: string | null;
    heroSubheading: string | null;
    visualThemeId: string | null;
    colourPaletteId: string | null;
    currency: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    cancellationFullRefundNoticeDays: number | null;
    cancellationNoRefundWithinDays: number | null;
    cancellationPolicyNote: string | null;
    aboutPageEnabled: boolean;
    policyPageEnabled: boolean;
    aboutPageMode: string | null;
    aboutTitle: string | null;
    aboutBody: string | null;
    aboutImageOneUrl: string | null;
    aboutImageTwoUrl: string | null;
    aboutImagePlacement: string | null;
    aboutStaffProfilesJson: unknown;
    contactTitle: string | null;
    contactIntro: string | null;
    contactMapEnabled: boolean;
    contactMapNote: string | null;
    policyTitle: string | null;
    policyIntro: string | null;
    policyBody: string | null;
    policyDefaultAccepted: boolean;
    paymentProcessorSetupMode: string | null;
    paymentProcessorName: string | null;
    paymentProcessorAccountRef: string | null;
    acceptCashPayments: boolean;
    acceptCardPayments: boolean;
    requireBookingPrepayment: boolean;
    allowInStorePaymentRecording: boolean;
    socialLinks: unknown;
    recurringPaymentsEnabled: boolean;
    customerBlockBookingsEnabled: boolean;
    giftVoucherSettingsJson: unknown;
  } | null;
  services: Array<{
    id: string;
    categoryId: string | null;
    name: string;
    description: string | null;
    basePrice: number | null;
    durationMinutes: number | null;
    bufferAfterMinutes: number | null;
    active: boolean;
    sortOrder: number;
    rolePriceOverrides: unknown;
    recurringEnabled: boolean;
    recurringIntervals: unknown;
    blockBookingEnabled: boolean;
    blockBookingSuggestedCounts: unknown;
  }>;
  serviceCategories: Array<{
    id: string;
    name: string;
    sortOrder: number;
    active: boolean;
  }>;
  staffRoles: Array<{
    id: string;
    label: string;
    platformRole: string | null;
    active: boolean;
    sortOrder: number;
  }>;
  staffMembers: Array<{
    id: string;
    roleId: string | null;
    displayName: string;
    roleLabel: string | null;
    email: string | null;
    phone: string | null;
    active: boolean;
    customerSelectable: boolean;
    isSuperUser: boolean;
    availableWeekdays: string[];
    sortOrder: number;
  }>;
  scheduling: {
    rotaDays: Array<{
      id: string;
      staffMemberId: string;
      weekday: string;
      working: boolean;
      startTime: string | null;
      endTime: string | null;
    }>;
    breakWindows: Array<{
      id: string;
      staffMemberId: string;
      weekday: string;
      label: string | null;
      startTime: string;
      endTime: string;
      active: boolean;
    }>;
    businessClosures: Array<{
      id: string;
      date: string;
      endDate: string | null;
      label: string;
      allDay: boolean;
      startTime: string | null;
      endTime: string | null;
      active: boolean;
      customerNote: string | null;
    }>;
    staffHolidays: Array<{
      id: string;
      staffMemberId: string;
      date: string;
      endDate: string | null;
      label: string;
      allDay: boolean;
      startTime: string | null;
      endTime: string | null;
      active: boolean;
      notes: string | null;
    }>;
  };
  recentBookings: Array<{
    id: string;
    customerName: string;
    serviceName: string | null;
    preferredDate: string | null;
    preferredTime: string | null;
    staffName: string | null;
    status: string;
    createdAtIso: string;
  }>;
};

const PREFERRED_PUBLIC_STATUSES = new Set(["DOMAIN_READY", "LIVE", "SITE_READY", "SITE_LIVE"]);
const RELAXED_PUBLIC_STATUSES = new Set([
  "SETUP_REQUESTED",
  "PAYMENT_PENDING",
  "DOMAIN_DETAILS_REQUIRED",
  "DNS_INSTRUCTIONS_SENT",
  "PROVISIONED",
  "DOMAIN_PENDING",
  "DOMAIN_READY",
  "LIVE",
  "SITE_PROVISIONING",
  "SITE_READY",
  "SITE_LIVE",
]);

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export async function getCustomerSitePreviewData(
  tenantSiteId: string,
): Promise<CustomerSitePreviewData | null> {
  const site = await prisma.tenantSite.findUnique({
    where: { id: tenantSiteId },
    include: {
      customerSiteSettings: true,
      customerSiteServices: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      customerSiteServiceCategories: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      customerSiteStaffRoles: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      customerSiteStaffMembers: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      customerSiteStaffRotaDays: {
        orderBy: [{ staffMemberId: "asc" }, { weekday: "asc" }, { createdAt: "asc" }],
      },
      customerSiteStaffBreakWindows: {
        orderBy: [{ staffMemberId: "asc" }, { weekday: "asc" }, { startTime: "asc" }],
      },
      customerSiteBusinessClosures: {
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      },
      customerSiteStaffHolidays: {
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      },
      customerSiteBookings: {
        orderBy: [{ createdAt: "desc" }],
        take: 10,
      },
    },
  });

  if (!site) return null;

  return {
    tenantSite: {
      id: site.id,
      slug: site.slug,
      displayName: site.displayName,
      industrySlug: site.industrySlug ?? null,
      domainPrimary: site.domainPrimary ?? null,
      provisioningStatus: site.provisioningStatus ?? null,
      createdAtIso: site.createdAt.toISOString(),
    },
    settings: site.customerSiteSettings
      ? {
          siteDisplayName: site.customerSiteSettings.siteDisplayName ?? null,
          businessName: site.customerSiteSettings.businessName ?? null,
          phone: site.customerSiteSettings.phone ?? null,
          email: site.customerSiteSettings.email ?? null,
          address: site.customerSiteSettings.address ?? null,
          openingHoursSummary: site.customerSiteSettings.openingHoursSummary ?? null,
          openingHoursJson: site.customerSiteSettings.openingHoursJson ?? null,
          heroHeadline: site.customerSiteSettings.heroHeadline ?? null,
          heroSubheading: site.customerSiteSettings.heroSubheading ?? null,
          visualThemeId: site.customerSiteSettings.visualThemeId ?? null,
          colourPaletteId: site.customerSiteSettings.colourPaletteId ?? null,
          currency: site.customerSiteSettings.currency ?? null,
          logoUrl: site.customerSiteSettings.logoUrl ?? null,
          faviconUrl: site.customerSiteSettings.faviconUrl ?? null,
          cancellationFullRefundNoticeDays:
            site.customerSiteSettings.cancellationFullRefundNoticeDays ?? null,
          cancellationNoRefundWithinDays:
            site.customerSiteSettings.cancellationNoRefundWithinDays ?? null,
          cancellationPolicyNote: site.customerSiteSettings.cancellationPolicyNote ?? null,
          aboutPageEnabled: site.customerSiteSettings.aboutPageEnabled,
          policyPageEnabled: site.customerSiteSettings.policyPageEnabled,
          aboutPageMode: site.customerSiteSettings.aboutPageMode ?? null,
          aboutTitle: site.customerSiteSettings.aboutTitle ?? null,
          aboutBody: site.customerSiteSettings.aboutBody ?? null,
          aboutImageOneUrl: site.customerSiteSettings.aboutImageOneUrl ?? null,
          aboutImageTwoUrl: site.customerSiteSettings.aboutImageTwoUrl ?? null,
          aboutImagePlacement: site.customerSiteSettings.aboutImagePlacement ?? null,
          aboutStaffProfilesJson: site.customerSiteSettings.aboutStaffProfilesJson ?? null,
          contactTitle: site.customerSiteSettings.contactTitle ?? null,
          contactIntro: site.customerSiteSettings.contactIntro ?? null,
          contactMapEnabled: site.customerSiteSettings.contactMapEnabled,
          contactMapNote: site.customerSiteSettings.contactMapNote ?? null,
          policyTitle: site.customerSiteSettings.policyTitle ?? null,
          policyIntro: site.customerSiteSettings.policyIntro ?? null,
          policyBody: site.customerSiteSettings.policyBody ?? null,
          policyDefaultAccepted: site.customerSiteSettings.policyDefaultAccepted,
          paymentProcessorSetupMode: site.customerSiteSettings.paymentProcessorSetupMode ?? null,
          paymentProcessorName: site.customerSiteSettings.paymentProcessorName ?? null,
          paymentProcessorAccountRef: site.customerSiteSettings.paymentProcessorAccountRef ?? null,
          acceptCashPayments: site.customerSiteSettings.acceptCashPayments,
          acceptCardPayments: site.customerSiteSettings.acceptCardPayments,
          requireBookingPrepayment: site.customerSiteSettings.requireBookingPrepayment,
          allowInStorePaymentRecording: site.customerSiteSettings.allowInStorePaymentRecording,
          socialLinks: site.customerSiteSettings.socialLinks ?? null,
          recurringPaymentsEnabled: site.customerSiteSettings.recurringPaymentsEnabled,
          customerBlockBookingsEnabled: site.customerSiteSettings.customerBlockBookingsEnabled,
          giftVoucherSettingsJson: site.customerSiteSettings.giftVoucherSettingsJson ?? null,
        }
      : null,
    services: site.customerSiteServices.map((service) => ({
      id: service.id,
      categoryId: service.categoryId ?? null,
      name: service.name,
      description: service.description ?? null,
      basePrice: service.basePrice === null ? null : Number(service.basePrice),
      durationMinutes: service.durationMinutes ?? null,
      bufferAfterMinutes: service.bufferAfterMinutes ?? null,
      active: service.active,
      sortOrder: service.sortOrder,
      rolePriceOverrides: service.rolePriceOverrides ?? null,
      recurringEnabled: service.recurringEnabled,
      recurringIntervals: service.recurringIntervals ?? null,
      blockBookingEnabled: service.blockBookingEnabled,
      blockBookingSuggestedCounts: service.blockBookingSuggestedCounts ?? null,
    })),
    serviceCategories: site.customerSiteServiceCategories.map((category) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      active: category.active,
    })),
    staffRoles: site.customerSiteStaffRoles.map((role) => ({
      id: role.id,
      label: role.label,
      platformRole: role.platformRole ?? null,
      active: role.active,
      sortOrder: role.sortOrder,
    })),
    staffMembers: site.customerSiteStaffMembers.map((member) => ({
      id: member.id,
      roleId: member.roleId ?? null,
      displayName: member.displayName,
      roleLabel: member.roleLabel ?? null,
      email: member.email ?? null,
      phone: member.phone ?? null,
      active: member.active,
      customerSelectable: member.customerSelectable,
      isSuperUser: member.isSuperUser,
      availableWeekdays: parseStringArray(member.availableWeekdays),
      sortOrder: member.sortOrder,
    })),
    scheduling: {
      rotaDays: site.customerSiteStaffRotaDays.map((day) => ({
        id: day.id,
        staffMemberId: day.staffMemberId,
        weekday: day.weekday,
        working: day.working,
        startTime: day.startTime ?? null,
        endTime: day.endTime ?? null,
      })),
      breakWindows: site.customerSiteStaffBreakWindows.map((window) => ({
        id: window.id,
        staffMemberId: window.staffMemberId,
        weekday: window.weekday,
        label: window.label ?? null,
        startTime: window.startTime,
        endTime: window.endTime,
        active: window.active,
      })),
      businessClosures: site.customerSiteBusinessClosures.map((closure) => ({
        id: closure.id,
        date: closure.date,
        endDate: closure.endDate ?? null,
        label: closure.label,
        allDay: closure.allDay,
        startTime: closure.startTime ?? null,
        endTime: closure.endTime ?? null,
        active: closure.active,
        customerNote: closure.customerNote ?? null,
      })),
      staffHolidays: site.customerSiteStaffHolidays.map((holiday) => ({
        id: holiday.id,
        staffMemberId: holiday.staffMemberId,
        date: holiday.date,
        endDate: holiday.endDate ?? null,
        label: holiday.label,
        allDay: holiday.allDay,
        startTime: holiday.startTime ?? null,
        endTime: holiday.endTime ?? null,
        active: holiday.active,
        notes: holiday.notes ?? null,
      })),
    },
    recentBookings: site.customerSiteBookings.map((booking) => ({
      id: booking.id,
      customerName: booking.customerName,
      serviceName: booking.serviceName ?? null,
      preferredDate: booking.preferredDate ?? null,
      preferredTime: booking.preferredTime ?? null,
      staffName: booking.staffName ?? null,
      status: booking.status,
      createdAtIso: booking.createdAt.toISOString(),
    })),
  };
}

function canRenderPublicByStatus(provisioningStatus: string | null): boolean {
  if (!provisioningStatus) return false;
  if (PREFERRED_PUBLIC_STATUSES.has(provisioningStatus)) return true;
  return RELAXED_PUBLIC_STATUSES.has(provisioningStatus);
}

export async function getCustomerSitePreviewDataBySlug(
  siteSlug: string,
): Promise<CustomerSitePreviewData | null> {
  const slug = siteSlug.trim().toLowerCase();
  if (!slug) return null;

  const site = await prisma.tenantSite.findUnique({
    where: { slug },
    select: { id: true, provisioningStatus: true },
  });

  if (!site) return null;
  if (!canRenderPublicByStatus(site.provisioningStatus ?? null)) return null;

  return getCustomerSitePreviewData(site.id);
}
