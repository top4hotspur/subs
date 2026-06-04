"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { BusinessSiteSettingsShell } from "@/components/admin/business-site-settings-shell";
import { getAdminTenantSiteDetail } from "@/lib/sites/admin-sites-client";
import {
  PersistedCustomerSiteService,
  PersistedCustomerSiteSettings,
  getAdminSitePersistedServices,
  getAdminSitePersistedSettings,
  putAdminSitePersistedServices,
  patchAdminSitePersistedSettings,
} from "@/lib/sites/admin-site-settings-client";
import {
  deletePersistedStaffMember,
  deletePersistedStaffRole,
  listPersistedStaff,
  listPersistedStaffRoles,
  savePersistedStaff,
  savePersistedStaffRoles,
} from "@/lib/sites/admin-site-staff-client";
import {
  getPersistedScheduling,
  savePersistedScheduling,
} from "@/lib/sites/admin-site-scheduling-client";
import {
  createPersistedSiteAdminUser,
  listPersistedSiteAdminUsers,
} from "@/lib/sites/admin-site-admin-users-client";
import type { CustomerSiteAdminUserRecord } from "@/lib/sites/customer-site-admin-user-types";
import type {
  CustomerSiteStaffMemberRecord,
  CustomerSiteStaffRoleRecord,
  WeekdayValue,
} from "@/lib/sites/customer-site-staff-types";
import type {
  CustomerSiteBusinessClosureRecord,
  CustomerSiteStaffBreakWindowRecord,
  CustomerSiteStaffHolidayRecord,
  CustomerSiteStaffRotaDayRecord,
} from "@/lib/sites/customer-site-scheduling-types";
import {
  mapAppearanceToTheme,
  resolveAppearanceMode,
  type SiteAppearanceMode,
} from "@/lib/sites/site-appearance";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import { formatOptional } from "@/lib/ui/display-labels";

type PersistedSettingsDraft = {
  siteDisplayName: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  openingHoursSummary: string;
  heroHeadline: string;
  heroSubheading: string;
  appearanceMode: SiteAppearanceMode;
  visualThemeId: string;
  colourPaletteId: string;
  currency: "GBP" | "EUR" | "USD";
  paymentProcessorSetupMode: "EXISTING_PROCESSOR" | "NEED_HELP_SETUP" | "MANUAL_RECORDING_ONLY";
  paymentProcessorName: "None" | "Stripe" | "Square" | "SumUp" | "PayPal" | "Worldpay" | "Zettle" | "Other";
  paymentProcessorAccountRef: string;
  paymentProcessorNotes: string;
  acceptCashPayments: boolean;
  acceptCardPayments: boolean;
  requireBookingPrepayment: boolean;
  allowInStorePaymentRecording: boolean;
  cancellationFullRefundNoticeDays: string;
  cancellationNoRefundWithinDays: string;
  cancellationPolicyNote: string;
  recurringPaymentsEnabled: boolean;
  customerBlockBookingsEnabled: boolean;
};

type PersistedServiceDraft = {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: string;
  durationMinutes: string;
  bufferAfterMinutes: string;
  active: boolean;
  sortOrder: string;
  rolePriceOverrides: string;
  recurringEnabled: boolean;
  recurringIntervals: Array<"WEEKLY" | "MONTHLY" | "ANNUALLY">;
  blockBookingEnabled: boolean;
  blockBookingSuggestedCounts: string;
};

type PersistedStaffRoleDraft = {
  id?: string;
  label: string;
  platformRole: string;
  active: boolean;
  sortOrder: string;
};

type PersistedStaffMemberDraft = {
  id?: string;
  roleId: string;
  displayName: string;
  roleLabel: string;
  email: string;
  phone: string;
  bio: string;
  active: boolean;
  customerSelectable: boolean;
  isSuperUser: boolean;
  availableWeekdays: WeekdayValue[];
  notes: string;
  sortOrder: string;
};

type PersistedRotaDayDraft = {
  id?: string;
  staffMemberId: string;
  weekday: WeekdayValue;
  working: boolean;
  startTime: string;
  endTime: string;
};

type PersistedBreakWindowDraft = {
  id?: string;
  staffMemberId: string;
  rotaDayId?: string;
  weekday: WeekdayValue;
  label: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

type PersistedBusinessClosureDraft = {
  id?: string;
  date: string;
  label: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  active: boolean;
};

type PersistedStaffHolidayDraft = {
  id?: string;
  staffMemberId: string;
  date: string;
  label: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  active: boolean;
};

type SiteAdminUserDraft = {
  email: string;
  displayName: string;
  role: "OWNER" | "ADMIN";
  invitationStatus: "INVITED" | "ACTIVE";
  active: boolean;
};

function toMessage(error: string, status: number): string {
  if (error === "BACKEND_PERSISTENCE_NOT_CONFIGURED" || status === 503) {
    return "Backend persistence is not configured for this environment yet.";
  }
  if (error === "FORBIDDEN" || status === 403) {
    return "Admin access denied. Please sign in with a platform admin account.";
  }
  if (error === "NETWORK_ERROR" || status === 0) {
    return "Network error while loading subscriber site detail.";
  }
  return `Could not load site detail: ${error}`;
}

function toSettingsDraft(record: PersistedCustomerSiteSettings | null): PersistedSettingsDraft {
  return {
    siteDisplayName: record?.siteDisplayName ?? "",
    businessName: record?.businessName ?? "",
    phone: record?.phone ?? "",
    email: record?.email ?? "",
    address: record?.address ?? "",
    openingHoursSummary: record?.openingHoursSummary ?? "",
    heroHeadline: record?.heroHeadline ?? "",
    heroSubheading: record?.heroSubheading ?? "",
    appearanceMode: resolveAppearanceMode(
      record?.visualThemeId,
      record?.colourPaletteId,
    ),
    visualThemeId: record?.visualThemeId ?? "",
    colourPaletteId: record?.colourPaletteId ?? "",
    currency: (record?.currency as "GBP" | "EUR" | "USD" | null) ?? "GBP",
    paymentProcessorSetupMode: record?.paymentProcessorSetupMode ?? "MANUAL_RECORDING_ONLY",
    paymentProcessorName: record?.paymentProcessorName ?? "Stripe",
    paymentProcessorAccountRef: record?.paymentProcessorAccountRef ?? "",
    paymentProcessorNotes: record?.paymentProcessorNotes ?? "",
    acceptCashPayments: record?.acceptCashPayments ?? false,
    acceptCardPayments: record?.acceptCardPayments ?? true,
    requireBookingPrepayment: record?.requireBookingPrepayment ?? false,
    allowInStorePaymentRecording: record?.allowInStorePaymentRecording ?? false,
    cancellationFullRefundNoticeDays: String(record?.cancellationFullRefundNoticeDays ?? 1),
    cancellationNoRefundWithinDays: String(record?.cancellationNoRefundWithinDays ?? 1),
    cancellationPolicyNote: record?.cancellationPolicyNote ?? "",
    recurringPaymentsEnabled: record?.recurringPaymentsEnabled ?? false,
    customerBlockBookingsEnabled: record?.customerBlockBookingsEnabled ?? false,
  };
}

function toServiceDraft(service: PersistedCustomerSiteService): PersistedServiceDraft {
  return {
    id: service.id,
    categoryId: service.categoryId ?? "",
    name: service.name,
    description: service.description ?? "",
    basePrice: service.basePrice === null ? "" : String(service.basePrice),
    durationMinutes: service.durationMinutes === null ? "" : String(service.durationMinutes),
    bufferAfterMinutes: service.bufferAfterMinutes === null ? "" : String(service.bufferAfterMinutes),
    active: service.active,
    sortOrder: String(service.sortOrder),
    rolePriceOverrides:
      service.rolePriceOverrides === null || service.rolePriceOverrides === undefined
        ? ""
        : JSON.stringify(service.rolePriceOverrides),
    recurringEnabled: service.recurringEnabled ?? false,
    recurringIntervals: Array.isArray(service.recurringIntervals)
      ? service.recurringIntervals.filter(
          (item): item is "WEEKLY" | "MONTHLY" | "ANNUALLY" =>
            item === "WEEKLY" || item === "MONTHLY" || item === "ANNUALLY",
        )
      : [],
    blockBookingEnabled: service.blockBookingEnabled ?? false,
    blockBookingSuggestedCounts: Array.isArray(service.blockBookingSuggestedCounts)
      ? service.blockBookingSuggestedCounts.join(", ")
      : "",
  };
}

function emptyServiceDraft(sortOrder: number): PersistedServiceDraft {
  return {
    name: "",
    categoryId: "",
    description: "",
    basePrice: "",
    durationMinutes: "",
    bufferAfterMinutes: "",
    active: true,
    sortOrder: String(sortOrder),
    rolePriceOverrides: "",
    recurringEnabled: false,
    recurringIntervals: [],
    blockBookingEnabled: false,
    blockBookingSuggestedCounts: "",
  };
}

const weekdayValues: WeekdayValue[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function weekdayLabel(weekday: WeekdayValue): string {
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

function toStaffRoleDraft(role: CustomerSiteStaffRoleRecord): PersistedStaffRoleDraft {
  return {
    id: role.id,
    label: role.label,
    platformRole: role.platformRole ?? "",
    active: role.active,
    sortOrder: String(role.sortOrder),
  };
}

function emptyStaffRoleDraft(sortOrder: number): PersistedStaffRoleDraft {
  return {
    label: "",
    platformRole: "",
    active: true,
    sortOrder: String(sortOrder),
  };
}

function toStaffMemberDraft(member: CustomerSiteStaffMemberRecord): PersistedStaffMemberDraft {
  return {
    id: member.id,
    roleId: member.roleId ?? "",
    displayName: member.displayName,
    roleLabel: member.roleLabel ?? "",
    email: member.email ?? "",
    phone: member.phone ?? "",
    bio: member.bio ?? "",
    active: member.active,
    customerSelectable: member.customerSelectable,
    isSuperUser: member.isSuperUser,
    availableWeekdays: member.availableWeekdays ?? [],
    notes: member.notes ?? "",
    sortOrder: String(member.sortOrder),
  };
}

function emptyStaffMemberDraft(sortOrder: number): PersistedStaffMemberDraft {
  return {
    roleId: "",
    displayName: "",
    roleLabel: "",
    email: "",
    phone: "",
    bio: "",
    active: true,
    customerSelectable: false,
    isSuperUser: false,
    availableWeekdays: [],
    notes: "",
    sortOrder: String(sortOrder),
  };
}

function toRotaDayDraft(day: CustomerSiteStaffRotaDayRecord): PersistedRotaDayDraft {
  return {
    id: day.id,
    staffMemberId: day.staffMemberId,
    weekday: day.weekday,
    working: day.working,
    startTime: day.startTime ?? "",
    endTime: day.endTime ?? "",
  };
}

function toBreakWindowDraft(window: CustomerSiteStaffBreakWindowRecord): PersistedBreakWindowDraft {
  return {
    id: window.id,
    staffMemberId: window.staffMemberId,
    rotaDayId: window.rotaDayId ?? undefined,
    weekday: window.weekday,
    label: window.label ?? "",
    startTime: window.startTime,
    endTime: window.endTime,
    active: window.active,
  };
}

function toBusinessClosureDraft(closure: CustomerSiteBusinessClosureRecord): PersistedBusinessClosureDraft {
  return {
    id: closure.id,
    date: closure.date,
    label: closure.label,
    allDay: closure.allDay,
    startTime: closure.startTime ?? "",
    endTime: closure.endTime ?? "",
    active: closure.active,
  };
}

function toStaffHolidayDraft(holiday: CustomerSiteStaffHolidayRecord): PersistedStaffHolidayDraft {
  return {
    id: holiday.id,
    staffMemberId: holiday.staffMemberId,
    date: holiday.date,
    label: holiday.label,
    allDay: holiday.allDay,
    startTime: holiday.startTime ?? "",
    endTime: holiday.endTime ?? "",
    active: holiday.active,
  };
}

function emptyBreakWindowDraft(staffMemberId = "", weekday: WeekdayValue = "monday"): PersistedBreakWindowDraft {
  return {
    staffMemberId,
    weekday,
    label: "",
    startTime: "12:00",
    endTime: "13:00",
    active: true,
  };
}

function emptyBusinessClosureDraft(): PersistedBusinessClosureDraft {
  return {
    date: "",
    label: "",
    allDay: true,
    startTime: "",
    endTime: "",
    active: true,
  };
}

function emptyStaffHolidayDraft(staffMemberId = ""): PersistedStaffHolidayDraft {
  return {
    staffMemberId,
    date: "",
    label: "",
    allDay: true,
    startTime: "",
    endTime: "",
    active: true,
  };
}

export default function AdminSiteSettingsPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = typeof params?.siteId === "string" ? params.siteId : "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [industrySlug, setIndustrySlug] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [settingsDraft, setSettingsDraft] = useState<PersistedSettingsDraft>(() =>
    toSettingsDraft(null),
  );
  const [servicesDraft, setServicesDraft] = useState<PersistedServiceDraft[]>([]);
  const [staffRolesDraft, setStaffRolesDraft] = useState<PersistedStaffRoleDraft[]>([]);
  const [staffMembersDraft, setStaffMembersDraft] = useState<PersistedStaffMemberDraft[]>([]);
  const [rotaDaysDraft, setRotaDaysDraft] = useState<PersistedRotaDayDraft[]>([]);
  const [breakWindowsDraft, setBreakWindowsDraft] = useState<PersistedBreakWindowDraft[]>([]);
  const [businessClosuresDraft, setBusinessClosuresDraft] = useState<PersistedBusinessClosureDraft[]>([]);
  const [staffHolidaysDraft, setStaffHolidaysDraft] = useState<PersistedStaffHolidayDraft[]>([]);
  const [selectedSchedulingStaffId, setSelectedSchedulingStaffId] = useState("");
  const [siteAdminUsers, setSiteAdminUsers] = useState<CustomerSiteAdminUserRecord[]>([]);
  const [generatedAccessCode, setGeneratedAccessCode] = useState<string | null>(null);
  const [siteAdminUserDraft, setSiteAdminUserDraft] = useState<SiteAdminUserDraft>({
    email: "",
    displayName: "",
    role: "OWNER",
    invitationStatus: "INVITED",
    active: true,
  });

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      if (!siteId) {
        setError("Missing site id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setMessage(null);

      const [detailResult, settingsResult, servicesResult, rolesResult, staffResult, schedulingResult, siteAdminUsersResult] = await Promise.all([
        getAdminTenantSiteDetail(siteId),
        getAdminSitePersistedSettings(siteId),
        getAdminSitePersistedServices(siteId),
        listPersistedStaffRoles(siteId),
        listPersistedStaff(siteId),
        getPersistedScheduling(siteId),
        listPersistedSiteAdminUsers(siteId),
      ]);

      if (!active) return;

      if (!detailResult.ok) {
        setError(toMessage(detailResult.error, detailResult.status));
        setLoading(false);
        return;
      }

      setSiteName(detailResult.site.displayName);
      setIndustrySlug(detailResult.site.industrySlug ?? null);

      if (!settingsResult.ok) {
        setError(toMessage(settingsResult.error, settingsResult.status));
        setLoading(false);
        return;
      }
      if (!servicesResult.ok) {
        setError(toMessage(servicesResult.error, servicesResult.status));
        setLoading(false);
        return;
      }
      if (!rolesResult.ok) {
        setError(toMessage(rolesResult.error, rolesResult.status));
        setLoading(false);
        return;
      }
      if (!staffResult.ok) {
        setError(toMessage(staffResult.error, staffResult.status));
        setLoading(false);
        return;
      }
      if (!schedulingResult.ok) {
        setError(toMessage(schedulingResult.error, schedulingResult.status));
        setLoading(false);
        return;
      }
      if (!siteAdminUsersResult.ok) {
        setError(toMessage(siteAdminUsersResult.error, siteAdminUsersResult.status));
        setLoading(false);
        return;
      }

      setSettingsDraft(toSettingsDraft(settingsResult.settings));
      setServicesDraft(servicesResult.services.map(toServiceDraft));
      setStaffRolesDraft(rolesResult.roles.map(toStaffRoleDraft));
      setStaffMembersDraft(staffResult.staff.map(toStaffMemberDraft));
      setRotaDaysDraft(schedulingResult.scheduling.rotaDays.map(toRotaDayDraft));
      setBreakWindowsDraft(schedulingResult.scheduling.breakWindows.map(toBreakWindowDraft));
      setBusinessClosuresDraft(schedulingResult.scheduling.businessClosures.map(toBusinessClosureDraft));
      setStaffHolidaysDraft(schedulingResult.scheduling.staffHolidays.map(toStaffHolidayDraft));
      setSiteAdminUsers(siteAdminUsersResult.users);
      setSelectedSchedulingStaffId(
        schedulingResult.scheduling.rotaDays[0]?.staffMemberId ??
          schedulingResult.scheduling.staffHolidays[0]?.staffMemberId ??
          staffResult.staff[0]?.id ??
          "",
      );
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [siteId]);

  async function createBusinessAdminAccessUser(): Promise<void> {
    if (!siteId) return;
    setGeneratedAccessCode(null);
    setMessage("Creating business owner/admin access...");
    const result = await createPersistedSiteAdminUser(siteId, {
      email: siteAdminUserDraft.email.trim().toLowerCase(),
      displayName: siteAdminUserDraft.displayName.trim() || null,
      role: siteAdminUserDraft.role,
      invitationStatus: siteAdminUserDraft.invitationStatus,
      active: siteAdminUserDraft.active,
    });
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setSiteAdminUsers((current) => {
      const without = current.filter((item) => item.id !== result.user.id);
      return [...without, result.user];
    });
    setGeneratedAccessCode(result.generatedAccessCode);
    setSiteAdminUserDraft((current) => ({ ...current, email: "", displayName: "" }));
    setMessage("Business owner/admin user saved. Share the one-time access code securely.");
  }

  async function savePersistedSettings(): Promise<void> {
    if (!siteId) return;
    setMessage("Saving persisted settings...");

    const appearance = mapAppearanceToTheme(settingsDraft.appearanceMode);
    const result = await patchAdminSitePersistedSettings(siteId, {
      siteDisplayName: settingsDraft.siteDisplayName || null,
      businessName: settingsDraft.businessName || null,
      phone: settingsDraft.phone || null,
      email: settingsDraft.email || null,
      address: settingsDraft.address || null,
      openingHoursSummary: settingsDraft.openingHoursSummary || null,
      heroHeadline: settingsDraft.heroHeadline || null,
      heroSubheading: settingsDraft.heroSubheading || null,
      visualThemeId: appearance.visualThemeId,
      colourPaletteId: appearance.colourPaletteId,
      currency: settingsDraft.currency,
      paymentProcessorSetupMode: settingsDraft.paymentProcessorSetupMode,
      paymentProcessorName: settingsDraft.paymentProcessorName,
      paymentProcessorAccountRef: settingsDraft.paymentProcessorAccountRef.trim() || null,
      paymentProcessorNotes: settingsDraft.paymentProcessorNotes.trim() || null,
      acceptCashPayments: settingsDraft.acceptCashPayments,
      acceptCardPayments: settingsDraft.acceptCardPayments,
      requireBookingPrepayment: settingsDraft.requireBookingPrepayment,
      allowInStorePaymentRecording: settingsDraft.allowInStorePaymentRecording,
      recurringPaymentsEnabled: settingsDraft.recurringPaymentsEnabled,
      customerBlockBookingsEnabled: settingsDraft.customerBlockBookingsEnabled,
      cancellationFullRefundNoticeDays: settingsDraft.cancellationFullRefundNoticeDays.trim()
        ? Number(settingsDraft.cancellationFullRefundNoticeDays)
        : null,
      cancellationNoRefundWithinDays: settingsDraft.cancellationNoRefundWithinDays.trim()
        ? Number(settingsDraft.cancellationNoRefundWithinDays)
        : null,
      cancellationPolicyNote: settingsDraft.cancellationPolicyNote.trim() || null,
    });

    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setSettingsDraft(toSettingsDraft(result.settings));
    setMessage("Persisted site settings saved.");
  }

  async function savePersistedServices(): Promise<void> {
    if (!siteId) return;
    setMessage("Saving persisted services...");

    const payload = servicesDraft.map((service, index) => {
      let parsedOverrides: unknown = undefined;
      if (service.rolePriceOverrides.trim()) {
        try {
          parsedOverrides = JSON.parse(service.rolePriceOverrides);
        } catch {
          parsedOverrides = service.rolePriceOverrides;
        }
      }

      return {
        id: service.id,
        categoryId: service.categoryId || null,
        name: service.name.trim(),
        description: service.description.trim() || null,
        basePrice: service.basePrice.trim() ? Number(service.basePrice) : null,
        durationMinutes: service.durationMinutes.trim()
          ? Number(service.durationMinutes)
          : null,
        bufferAfterMinutes: service.bufferAfterMinutes.trim()
          ? Number(service.bufferAfterMinutes)
          : null,
        active: service.active,
        sortOrder: service.sortOrder.trim() ? Number(service.sortOrder) : index,
        rolePriceOverrides: parsedOverrides ?? null,
        recurringEnabled: service.recurringEnabled,
        recurringIntervals: service.recurringIntervals.slice(0, 1),
        blockBookingEnabled: service.blockBookingEnabled,
        blockBookingSuggestedCounts: service.blockBookingSuggestedCounts
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value >= 2 && value <= 52),
      };
    });

    const result = await putAdminSitePersistedServices(siteId, payload);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setServicesDraft(result.services.map(toServiceDraft));
    setMessage("Persisted services saved.");
  }

  async function savePersistedStaffRolesSection(): Promise<void> {
    if (!siteId) return;
    setMessage("Saving persisted staff roles...");

    const payload = staffRolesDraft.map((role, index) => ({
      id: role.id,
      label: role.label.trim(),
      platformRole: role.platformRole.trim() || null,
      active: role.active,
      sortOrder: role.sortOrder.trim() ? Number(role.sortOrder) : index,
    }));

    const result = await savePersistedStaffRoles(siteId, payload);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setStaffRolesDraft(result.roles.map(toStaffRoleDraft));
    setMessage("Persisted staff roles saved.");
  }

  async function savePersistedStaffMembersSection(): Promise<void> {
    if (!siteId) return;
    setMessage("Saving persisted staff members...");

    const payload = staffMembersDraft.map((member, index) => ({
      id: member.id,
      roleId: member.roleId.trim() || null,
      displayName: member.displayName.trim(),
      roleLabel: member.roleLabel.trim() || null,
      email: member.email.trim() || null,
      phone: member.phone.trim() || null,
      bio: member.bio.trim() || null,
      active: member.active,
      customerSelectable: member.customerSelectable,
      isSuperUser: member.isSuperUser,
      availableWeekdays: member.availableWeekdays,
      notes: member.notes.trim() || null,
      sortOrder: member.sortOrder.trim() ? Number(member.sortOrder) : index,
    }));

    const result = await savePersistedStaff(siteId, payload);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setStaffMembersDraft(result.staff.map(toStaffMemberDraft));
    setMessage("Persisted staff members saved.");
  }

  async function deleteRole(id?: string): Promise<void> {
    if (!siteId || !id) return;
    const result = await deletePersistedStaffRole(siteId, id);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setStaffRolesDraft((current) => current.filter((role) => role.id !== id));
    setStaffMembersDraft((current) =>
      current.map((member) => (member.roleId === id ? { ...member, roleId: "" } : member)),
    );
    setMessage("Staff role deleted. Linked staff role references were cleared.");
  }

  async function deleteStaff(id?: string): Promise<void> {
    if (!siteId || !id) return;
    const result = await deletePersistedStaffMember(siteId, id);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setStaffMembersDraft((current) => current.filter((member) => member.id !== id));
    setMessage("Staff member deleted.");
  }

  async function savePersistedSchedulingSection(): Promise<void> {
    if (!siteId) return;
    setMessage("Saving persisted scheduling...");

    const payload = {
      rotaDays: rotaDaysDraft.map((day) => ({
        id: day.id,
        staffMemberId: day.staffMemberId,
        weekday: day.weekday,
        working: day.working,
        startTime: day.startTime.trim() || null,
        endTime: day.endTime.trim() || null,
      })),
      breakWindows: breakWindowsDraft.map((window) => ({
        id: window.id,
        staffMemberId: window.staffMemberId,
        rotaDayId: window.rotaDayId ?? null,
        weekday: window.weekday,
        label: window.label.trim() || null,
        startTime: window.startTime,
        endTime: window.endTime,
        active: window.active,
      })),
      businessClosures: businessClosuresDraft.map((closure) => ({
        id: closure.id,
        date: closure.date,
        label: closure.label.trim(),
        allDay: closure.allDay,
        startTime: closure.allDay ? null : closure.startTime.trim() || null,
        endTime: closure.allDay ? null : closure.endTime.trim() || null,
        active: closure.active,
      })),
      staffHolidays: staffHolidaysDraft.map((holiday) => ({
        id: holiday.id,
        staffMemberId: holiday.staffMemberId,
        date: holiday.date,
        label: holiday.label.trim(),
        allDay: holiday.allDay,
        startTime: holiday.allDay ? null : holiday.startTime.trim() || null,
        endTime: holiday.allDay ? null : holiday.endTime.trim() || null,
        active: holiday.active,
      })),
    };

    const result = await savePersistedScheduling(siteId, payload);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setRotaDaysDraft(result.scheduling.rotaDays.map(toRotaDayDraft));
    setBreakWindowsDraft(result.scheduling.breakWindows.map(toBreakWindowDraft));
    setBusinessClosuresDraft(result.scheduling.businessClosures.map(toBusinessClosureDraft));
    setStaffHolidaysDraft(result.scheduling.staffHolidays.map(toStaffHolidayDraft));
    setMessage("Persisted scheduling saved.");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Subscriber Site Setup Data for {siteName ?? "Subscriber site"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Support/provisioning settings editor until subscriber admin auth is added.
          </p>
          <p className="mt-1 text-xs text-slate-600">
            This edits live subscriber-site data. Demo data is not copied automatically.
          </p>
          {industrySlug ? (
            <p className="mt-1 text-sm text-slate-600">
              Linked subscriber industry: <span className="font-semibold">{formatOptional(industrySlug)}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/sites/${encodeURIComponent(siteId)}/preview`}
            className={`${outlineButtonClass} ${smallButtonClass}`}
          >
            Preview persisted customer site
          </Link>
          <Link href={`/admin/sites?siteId=${encodeURIComponent(siteId)}`} className={`${outlineButtonClass} ${smallButtonClass}`}>
            Back to subscriber site
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      <AdminPillNav />

      {loading ? <p className="mt-6 text-sm text-slate-600">Loading site detail...</p> : null}
      {error ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p>{error}</p>
          <div className="mt-3">
            <Link href="/admin/sites" className={`${outlineButtonClass} ${smallButtonClass}`}>
              Back to subscriber sites
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="mt-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Persisted site settings</h2>
            <p className="mt-2 text-sm text-slate-600">
              Support/provisioning view only. Business owners manage this live subscriber-site data in their site admin area.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Support/provisioning view only. Business owner controls this from their site admin.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">Site display name
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.siteDisplayName} onChange={(event) => setSettingsDraft((current) => ({ ...current, siteDisplayName: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700">Business name
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.businessName} onChange={(event) => setSettingsDraft((current) => ({ ...current, businessName: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700">Phone
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.phone} onChange={(event) => setSettingsDraft((current) => ({ ...current, phone: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700">Email
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.email} onChange={(event) => setSettingsDraft((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Address
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.address} onChange={(event) => setSettingsDraft((current) => ({ ...current, address: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Opening hours summary
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.openingHoursSummary} onChange={(event) => setSettingsDraft((current) => ({ ...current, openingHoursSummary: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Hero headline
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.heroHeadline} onChange={(event) => setSettingsDraft((current) => ({ ...current, heroHeadline: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Hero subheading
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.heroSubheading} onChange={(event) => setSettingsDraft((current) => ({ ...current, heroSubheading: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700">Site appearance
                <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.appearanceMode} onChange={(event) => setSettingsDraft((current) => ({ ...current, appearanceMode: event.target.value as SiteAppearanceMode }))}>
                  <option value="LIGHT">Light</option>
                  <option value="DARK">Dark</option>
                </select>
                <span className="mt-1 block text-[11px] font-normal text-slate-600">
                  Choose a simple light or dark appearance. Layout quality stays controlled.
                </span>
              </label>
              <label className="text-xs font-semibold text-slate-700">Currency
                <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.currency} onChange={(event) => setSettingsDraft((current) => ({ ...current, currency: event.target.value as "GBP" | "EUR" | "USD" }))}>
                  <option value="GBP">GBP</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </label>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Payments and policies</h3>
              <p className="mt-1 text-xs text-slate-600">
                This records setup intent only. No payment provider is connected and no payment processing happens in this pass.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                  Payment setup mode
                  <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.paymentProcessorSetupMode} onChange={(event) => setSettingsDraft((current) => ({ ...current, paymentProcessorSetupMode: event.target.value as PersistedSettingsDraft["paymentProcessorSetupMode"] }))}>
                    <option value="EXISTING_PROCESSOR">I already have a payment processor</option>
                    <option value="NEED_HELP_SETUP">I need help setting one up</option>
                    <option value="MANUAL_RECORDING_ONLY">I don&apos;t need an online payment processor</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Provider
                  <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.paymentProcessorName} onChange={(event) => setSettingsDraft((current) => ({ ...current, paymentProcessorName: event.target.value as PersistedSettingsDraft["paymentProcessorName"] }))}>
                    <option value="None">None / no online payment provider</option>
                    <option value="Stripe">Stripe</option>
                    <option value="Square">Square</option>
                    <option value="SumUp">SumUp</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Worldpay">Worldpay</option>
                    <option value="Zettle">Zettle</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Account reference / provider email
                  <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.paymentProcessorAccountRef} onChange={(event) => setSettingsDraft((current) => ({ ...current, paymentProcessorAccountRef: event.target.value }))} />
                  <span className="mt-1 block text-[11px] font-normal text-slate-600">Do not enter API keys or passwords.</span>
                </label>
                <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                  Setup notes
                  <textarea className="mt-1 min-h-[72px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.paymentProcessorNotes} onChange={(event) => setSettingsDraft((current) => ({ ...current, paymentProcessorNotes: event.target.value }))} />
                </label>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input type="checkbox" checked={settingsDraft.acceptCardPayments} onChange={(event) => setSettingsDraft((current) => ({ ...current, acceptCardPayments: event.target.checked }))} />
                  Accept card payments
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input type="checkbox" checked={settingsDraft.acceptCashPayments} onChange={(event) => setSettingsDraft((current) => ({ ...current, acceptCashPayments: event.target.checked }))} />
                  Accept cash payments
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input type="checkbox" checked={settingsDraft.requireBookingPrepayment} onChange={(event) => setSettingsDraft((current) => ({ ...current, requireBookingPrepayment: event.target.checked }))} />
                  Require prepayment for online bookings
                </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={settingsDraft.allowInStorePaymentRecording} onChange={(event) => setSettingsDraft((current) => ({ ...current, allowInStorePaymentRecording: event.target.checked }))} />
                Allow in-store payment recording
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={settingsDraft.recurringPaymentsEnabled} onChange={(event) => setSettingsDraft((current) => ({ ...current, recurringPaymentsEnabled: event.target.checked }))} />
                Enable recurring services/payments options
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={settingsDraft.customerBlockBookingsEnabled} onChange={(event) => setSettingsDraft((current) => ({ ...current, customerBlockBookingsEnabled: event.target.checked }))} />
                Allow customer block bookings
              </label>
            </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">
                  Full refund notice period (days)
                  <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.cancellationFullRefundNoticeDays} onChange={(event) => setSettingsDraft((current) => ({ ...current, cancellationFullRefundNoticeDays: event.target.value }))} />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  No refund within (days)
                  <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.cancellationNoRefundWithinDays} onChange={(event) => setSettingsDraft((current) => ({ ...current, cancellationNoRefundWithinDays: event.target.value }))} />
                </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                Cancellation policy note
                <textarea className="mt-1 min-h-[72px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.cancellationPolicyNote} onChange={(event) => setSettingsDraft((current) => ({ ...current, cancellationPolicyNote: event.target.value }))} />
              </label>
            </div>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold text-slate-900">Recurring payment issues</p>
              <p className="mt-1 text-xs text-slate-600">No failed recurring payments to review.</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Support placeholder only in this pass. Provider-linked issue reporting will come with real recurring billing integration.
              </p>
            </div>
          </div>

            <div className="mt-4">
              <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={savePersistedSettings}>
                Save persisted settings
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Persisted services</h2>
              <button
                type="button"
                className={`${outlineButtonClass} ${smallButtonClass}`}
                onClick={() => setServicesDraft((current) => [...current, emptyServiceDraft(current.length)])}
              >
                Add service row
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {servicesDraft.length === 0 ? (
                <p className="text-sm text-slate-600">No persisted services yet.</p>
              ) : (
                servicesDraft.map((service, index) => (
                  <div key={`${service.id ?? "new"}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">Service {index + 1}</p>
                      <button
                        type="button"
                        className="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        onClick={() => setServicesDraft((current) => current.filter((_, i) => i !== index))}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-700">Name
                        <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.name} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">Base price
                        <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.basePrice} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, basePrice: event.target.value } : row))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">Duration minutes
                        <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.durationMinutes} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, durationMinutes: event.target.value } : row))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">Buffer after minutes
                        <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.bufferAfterMinutes} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, bufferAfterMinutes: event.target.value } : row))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">Sort order
                        <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.sortOrder} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, sortOrder: event.target.value } : row))} />
                      </label>
                      <label className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={service.active} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                        Active
                      </label>
                      <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Description
                        <textarea className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" rows={2} value={service.description} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, description: event.target.value } : row))} />
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                        <input type="checkbox" checked={service.recurringEnabled} disabled={!settingsDraft.recurringPaymentsEnabled} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, recurringEnabled: event.target.checked } : row))} />
                        Allow this service to be sold as recurring
                      </label>
                      {service.recurringEnabled && settingsDraft.recurringPaymentsEnabled ? (
                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold text-slate-700">Recurring intervals</p>
                          <div className="mt-1 flex flex-wrap gap-3">
                            {(["WEEKLY", "MONTHLY", "ANNUALLY"] as const).map((interval) => (
                              <label key={interval} className="flex items-center gap-1 text-xs text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={service.recurringIntervals.includes(interval)}
                                  onChange={(event) =>
                                    setServicesDraft((current) =>
                                      current.map((row, i) => {
                                        if (i !== index) return row;
                                        const next = new Set(row.recurringIntervals);
                                        if (event.target.checked) next.add(interval);
                                        else next.delete(interval);
                                        return { ...row, recurringIntervals: [...next] };
                                      }),
                                    )
                                  }
                                />
                                {interval.charAt(0) + interval.slice(1).toLowerCase()}
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                        <input type="checkbox" checked={service.blockBookingEnabled} disabled={!settingsDraft.customerBlockBookingsEnabled} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, blockBookingEnabled: event.target.checked } : row))} />
                        Allow block bookings for this service
                      </label>
                      {service.blockBookingEnabled && settingsDraft.customerBlockBookingsEnabled ? (
                        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                          Suggested block counts (comma separated)
                          <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="5, 10, 12" value={service.blockBookingSuggestedCounts} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, blockBookingSuggestedCounts: event.target.value } : row))} />
                        </label>
                      ) : null}
                      <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Role price overrides JSON (optional)
                        <textarea className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs" rows={2} value={service.rolePriceOverrides} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, rolePriceOverrides: event.target.value } : row))} />
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4">
              <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={savePersistedServices}>
                Save persisted services
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Persisted staff and roles</h2>
            <p className="mt-2 text-sm text-slate-600">
              Staff records and role definitions are persisted per subscriber site. Use this for support/provisioning changes.
            </p>

            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Staff roles/positions</h3>
                  <button
                    type="button"
                    className={`${outlineButtonClass} ${smallButtonClass}`}
                    onClick={() => setStaffRolesDraft((current) => [...current, emptyStaffRoleDraft(current.length)])}
                  >
                    Add role
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {staffRolesDraft.length === 0 ? (
                    <p className="text-sm text-slate-600">No persisted roles yet.</p>
                  ) : (
                    staffRolesDraft.map((role, index) => (
                      <div key={`${role.id ?? "new"}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="text-xs font-semibold text-slate-700">Label
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={role.label} onChange={(event) => setStaffRolesDraft((current) => current.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Platform role
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={role.platformRole} onChange={(event) => setStaffRolesDraft((current) => current.map((row, i) => i === index ? { ...row, platformRole: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Sort order
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={role.sortOrder} onChange={(event) => setStaffRolesDraft((current) => current.map((row, i) => i === index ? { ...row, sortOrder: event.target.value } : row))} />
                          </label>
                          <label className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={role.active} onChange={(event) => setStaffRolesDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                            Active
                          </label>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              if (role.id) {
                                void deleteRole(role.id);
                              } else {
                                setStaffRolesDraft((current) => current.filter((_, i) => i !== index));
                              }
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3">
                  <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={savePersistedStaffRolesSection}>
                    Save persisted roles
                  </button>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Staff members</h3>
                  <button
                    type="button"
                    className={`${outlineButtonClass} ${smallButtonClass}`}
                    onClick={() => setStaffMembersDraft((current) => [...current, emptyStaffMemberDraft(current.length)])}
                  >
                    Add staff member
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {staffMembersDraft.length === 0 ? (
                    <p className="text-sm text-slate-600">No persisted staff yet.</p>
                  ) : (
                    staffMembersDraft.map((member, index) => (
                      <div key={`${member.id ?? "new"}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="text-xs font-semibold text-slate-700">Name
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={member.displayName} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, displayName: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Role
                            <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={member.roleId} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, roleId: event.target.value } : row))}>
                              <option value="">None</option>
                              {staffRolesDraft.map((role, roleIndex) => (
                                <option key={`${role.id ?? "new-role"}-${roleIndex}`} value={role.id ?? ""}>{role.label || "Untitled role"}</option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Role label fallback
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={member.roleLabel} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, roleLabel: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Email
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={member.email} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, email: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Phone
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={member.phone} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, phone: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Sort order
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={member.sortOrder} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, sortOrder: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Bio
                            <textarea className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" rows={2} value={member.bio} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, bio: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Notes
                            <textarea className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" rows={2} value={member.notes} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, notes: event.target.value } : row))} />
                          </label>
                          <div className="sm:col-span-2">
                            <p className="text-xs font-semibold text-slate-700">Available weekdays</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {weekdayValues.map((weekday) => (
                                <label key={weekday} className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={member.availableWeekdays.includes(weekday)}
                                    onChange={(event) => {
                                      setStaffMembersDraft((current) =>
                                        current.map((row, i) =>
                                          i === index
                                            ? {
                                                ...row,
                                                availableWeekdays: event.target.checked
                                                  ? [...row.availableWeekdays, weekday]
                                                  : row.availableWeekdays.filter((item) => item !== weekday),
                                              }
                                            : row,
                                        ),
                                      );
                                    }}
                                  />
                                  {weekdayLabel(weekday)}
                                </label>
                              ))}
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={member.active} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                            Active
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={member.customerSelectable} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, customerSelectable: event.target.checked } : row))} />
                            Customer selectable
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={member.isSuperUser} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, isSuperUser: event.target.checked } : row))} />
                            Super user
                          </label>
                        </div>
                        <div className="mt-2">
                          <button
                            type="button"
                            className="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              if (member.id) {
                                void deleteStaff(member.id);
                              } else {
                                setStaffMembersDraft((current) => current.filter((_, i) => i !== index));
                              }
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3">
                  <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={savePersistedStaffMembersSection}>
                    Save persisted staff
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Persisted rota, breaks and closures</h2>
            <p className="mt-2 text-sm text-slate-600">
              Booking conflict checks and live customer booking use of these persisted scheduling records will be wired in a later pass. This stores the site&apos;s scheduling configuration.
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700">Selected staff member
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm sm:max-w-sm"
                  value={selectedSchedulingStaffId}
                  onChange={(event) => setSelectedSchedulingStaffId(event.target.value)}
                >
                  <option value="">Select staff member</option>
                  {staffMembersDraft.map((staff, index) => (
                    <option key={`${staff.id ?? "new"}-${index}`} value={staff.id ?? ""}>
                      {staff.displayName || "Unnamed staff"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Staff rota days</h3>
                <div className="mt-2 space-y-2">
                  {weekdayValues.map((weekday) => {
                    const selectedStaff = staffMembersDraft.find((staff) => staff.id === selectedSchedulingStaffId);
                    const allowedWeekday = selectedStaff
                      ? selectedStaff.availableWeekdays.includes(weekday)
                      : true;
                    const existing = rotaDaysDraft.find(
                      (day) => day.staffMemberId === selectedSchedulingStaffId && day.weekday === weekday,
                    );
                    const row = existing ?? {
                      staffMemberId: selectedSchedulingStaffId,
                      weekday,
                      working: false,
                      startTime: "",
                      endTime: "",
                    };
                    return (
                      <div key={weekday} className={`rounded-md border p-2 ${allowedWeekday ? "border-slate-200 bg-slate-50" : "border-amber-300 bg-amber-50"}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="w-24 text-xs font-semibold text-slate-800">{weekdayLabel(weekday)}</p>
                          <label className="flex items-center gap-1 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={row.working}
                              disabled={!selectedSchedulingStaffId || !allowedWeekday}
                              onChange={(event) => {
                                if (!selectedSchedulingStaffId) return;
                                const next = { ...row, working: event.target.checked };
                                setRotaDaysDraft((current) => {
                                  const without = current.filter((item) => !(item.staffMemberId === selectedSchedulingStaffId && item.weekday === weekday));
                                  return [...without, next];
                                });
                              }}
                            />
                            Working
                          </label>
                          <input
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                            placeholder="09:00"
                            value={row.startTime}
                            disabled={!row.working || !selectedSchedulingStaffId || !allowedWeekday}
                            onChange={(event) => {
                              if (!selectedSchedulingStaffId) return;
                              const next = { ...row, startTime: event.target.value };
                              setRotaDaysDraft((current) => {
                                const without = current.filter((item) => !(item.staffMemberId === selectedSchedulingStaffId && item.weekday === weekday));
                                return [...without, next];
                              });
                            }}
                          />
                          <input
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                            placeholder="17:00"
                            value={row.endTime}
                            disabled={!row.working || !selectedSchedulingStaffId || !allowedWeekday}
                            onChange={(event) => {
                              if (!selectedSchedulingStaffId) return;
                              const next = { ...row, endTime: event.target.value };
                              setRotaDaysDraft((current) => {
                                const without = current.filter((item) => !(item.staffMemberId === selectedSchedulingStaffId && item.weekday === weekday));
                                return [...without, next];
                              });
                            }}
                          />
                        </div>
                        {!allowedWeekday ? (
                          <p className="mt-1 text-xs text-amber-800">This day is not in the staff member&apos;s available weekdays.</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Break windows</h3>
                  <button
                    type="button"
                    className={`${outlineButtonClass} ${smallButtonClass}`}
                    onClick={() =>
                      setBreakWindowsDraft((current) => [
                        ...current,
                        emptyBreakWindowDraft(selectedSchedulingStaffId || "", "monday"),
                      ])
                    }
                  >
                    Add break
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {breakWindowsDraft.length === 0 ? (
                    <p className="text-sm text-slate-600">No persisted breaks yet.</p>
                  ) : (
                    breakWindowsDraft.map((window, index) => (
                      <div key={`${window.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="text-xs font-semibold text-slate-700">Staff
                            <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.staffMemberId} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, staffMemberId: event.target.value } : row))}>
                              <option value="">Select staff</option>
                              {staffMembersDraft.map((staff, staffIndex) => (
                                <option key={`${staff.id ?? "new"}-${staffIndex}`} value={staff.id ?? ""}>{staff.displayName || "Unnamed staff"}</option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Weekday
                            <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.weekday} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, weekday: event.target.value as WeekdayValue } : row))}>
                              {weekdayValues.map((weekday) => (
                                <option key={weekday} value={weekday}>{weekdayLabel(weekday)}</option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Label
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.label} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} />
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mt-5">
                            <input type="checkbox" checked={window.active} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                            Active
                          </label>
                          <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.startTime} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, startTime: event.target.value } : row))} placeholder="12:00" />
                          <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.endTime} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, endTime: event.target.value } : row))} placeholder="13:00" />
                        </div>
                        <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setBreakWindowsDraft((current) => current.filter((_, i) => i !== index))}>Remove</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Business closures</h3>
                  <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setBusinessClosuresDraft((current) => [...current, emptyBusinessClosureDraft()])}>Add closure</button>
                </div>
                <div className="mt-2 space-y-2">
                  {businessClosuresDraft.length === 0 ? (
                    <p className="text-sm text-slate-600">No persisted business closures yet.</p>
                  ) : (
                    businessClosuresDraft.map((closure, index) => (
                      <div key={`${closure.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="YYYY-MM-DD" value={closure.date} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, date: event.target.value } : row))} />
                          <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Label" value={closure.label} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} />
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={closure.allDay} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, allDay: event.target.checked } : row))} />
                            All day
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={closure.active} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                            Active
                          </label>
                          {!closure.allDay ? (
                            <>
                              <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Start HH:mm" value={closure.startTime} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, startTime: event.target.value } : row))} />
                              <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="End HH:mm" value={closure.endTime} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, endTime: event.target.value } : row))} />
                            </>
                          ) : null}
                        </div>
                        <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setBusinessClosuresDraft((current) => current.filter((_, i) => i !== index))}>Remove</button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Staff holidays</h3>
                  <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setStaffHolidaysDraft((current) => [...current, emptyStaffHolidayDraft(selectedSchedulingStaffId || "")])}>Add holiday</button>
                </div>
                <div className="mt-2 space-y-2">
                  {staffHolidaysDraft.length === 0 ? (
                    <p className="text-sm text-slate-600">No persisted staff holidays yet.</p>
                  ) : (
                    staffHolidaysDraft.map((holiday, index) => (
                      <div key={`${holiday.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <select className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={holiday.staffMemberId} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, staffMemberId: event.target.value } : row))}>
                            <option value="">Select staff</option>
                            {staffMembersDraft.map((staff, staffIndex) => (
                              <option key={`${staff.id ?? "new"}-${staffIndex}`} value={staff.id ?? ""}>{staff.displayName || "Unnamed staff"}</option>
                            ))}
                          </select>
                          <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="YYYY-MM-DD" value={holiday.date} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, date: event.target.value } : row))} />
                          <input className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-2" placeholder="Label" value={holiday.label} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} />
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={holiday.allDay} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, allDay: event.target.checked } : row))} />
                            All day
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={holiday.active} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                            Active
                          </label>
                          {!holiday.allDay ? (
                            <>
                              <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Start HH:mm" value={holiday.startTime} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, startTime: event.target.value } : row))} />
                              <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="End HH:mm" value={holiday.endTime} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, endTime: event.target.value } : row))} />
                            </>
                          ) : null}
                        </div>
                        <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setStaffHolidaysDraft((current) => current.filter((_, i) => i !== index))}>Remove</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={savePersistedSchedulingSection}>
                Save persisted scheduling
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Business owner access</h2>
            <p className="mt-2 text-sm text-slate-600">
              Platform admin bootstrap for subscriber business-owner/admin login. This is tenant-scoped and separate from platform admin auth.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Real invite email sending is not enabled in this pass.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">Email
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={siteAdminUserDraft.email} onChange={(event) => setSiteAdminUserDraft((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700">Display name
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={siteAdminUserDraft.displayName} onChange={(event) => setSiteAdminUserDraft((current) => ({ ...current, displayName: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700">Role
                <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={siteAdminUserDraft.role} onChange={(event) => setSiteAdminUserDraft((current) => ({ ...current, role: event.target.value as "OWNER" | "ADMIN" }))}>
                  <option value="OWNER">OWNER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">Invitation status
                <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={siteAdminUserDraft.invitationStatus} onChange={(event) => setSiteAdminUserDraft((current) => ({ ...current, invitationStatus: event.target.value as "INVITED" | "ACTIVE" }))}>
                  <option value="INVITED">INVITED</option>
                  <option value="ACTIVE">ACTIVE</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={siteAdminUserDraft.active} onChange={(event) => setSiteAdminUserDraft((current) => ({ ...current, active: event.target.checked }))} />
                Active
              </label>
            </div>
            <button type="button" className={`mt-3 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void createBusinessAdminAccessUser()}>
              Create business owner/admin access
            </button>

            {generatedAccessCode ? (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-900">Temporary access code (shown once)</p>
                <p className="mt-1 text-sm text-emerald-800">{generatedAccessCode}</p>
              </div>
            ) : null}

            <div className="mt-4 space-y-2">
              {siteAdminUsers.length === 0 ? (
                <p className="text-sm text-slate-600">No business-owner users added yet.</p>
              ) : (
                siteAdminUsers.map((user) => (
                  <div key={user.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{user.email}</p>
                    <p>Role: {user.role} | Status: {user.invitationStatus} | Active: {user.active ? "Yes" : "No"}</p>
                    <p>Name: {user.displayName || "Not set"}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Demo/settings preview</h2>
            <p className="mt-2 text-sm text-slate-600">
              This is demo-only tooling and is separate from live persisted subscriber-site data above.
            </p>
            <div className="mt-4">
              <BusinessSiteSettingsShell />
            </div>
          </section>

          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        </div>
      ) : null}
    </main>
  );
}
