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
    heroHeadline: string | null;
    heroSubheading: string | null;
    visualThemeId: string | null;
    colourPaletteId: string | null;
    currency: string | null;
  } | null;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    basePrice: number | null;
    durationMinutes: number | null;
    bufferAfterMinutes: number | null;
    active: boolean;
    sortOrder: number;
    rolePriceOverrides: unknown;
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
      label: string;
      allDay: boolean;
      startTime: string | null;
      endTime: string | null;
      active: boolean;
    }>;
    staffHolidays: Array<{
      id: string;
      staffMemberId: string;
      date: string;
      label: string;
      allDay: boolean;
      startTime: string | null;
      endTime: string | null;
      active: boolean;
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
          heroHeadline: site.customerSiteSettings.heroHeadline ?? null,
          heroSubheading: site.customerSiteSettings.heroSubheading ?? null,
          visualThemeId: site.customerSiteSettings.visualThemeId ?? null,
          colourPaletteId: site.customerSiteSettings.colourPaletteId ?? null,
          currency: site.customerSiteSettings.currency ?? null,
        }
      : null,
    services: site.customerSiteServices.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description ?? null,
      basePrice: service.basePrice === null ? null : Number(service.basePrice),
      durationMinutes: service.durationMinutes ?? null,
      bufferAfterMinutes: service.bufferAfterMinutes ?? null,
      active: service.active,
      sortOrder: service.sortOrder,
      rolePriceOverrides: service.rolePriceOverrides ?? null,
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
        label: closure.label,
        allDay: closure.allDay,
        startTime: closure.startTime ?? null,
        endTime: closure.endTime ?? null,
        active: closure.active,
      })),
      staffHolidays: site.customerSiteStaffHolidays.map((holiday) => ({
        id: holiday.id,
        staffMemberId: holiday.staffMemberId,
        date: holiday.date,
        label: holiday.label,
        allDay: holiday.allDay,
        startTime: holiday.startTime ?? null,
        endTime: holiday.endTime ?? null,
        active: holiday.active,
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
