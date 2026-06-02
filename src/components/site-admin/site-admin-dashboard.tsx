"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  PersistedCustomerSiteServiceCategory,
  PersistedCustomerSiteService,
  PersistedCustomerSiteSettings,
} from "@/lib/sites/admin-site-settings-client";
import {
  getSiteAdminServices,
  getSiteAdminSettings,
  patchSiteAdminSettings,
  putSiteAdminServices,
  listSiteAdminStaffRoles,
  saveSiteAdminStaffRoles,
  listSiteAdminStaff,
  saveSiteAdminStaff,
  getSiteAdminScheduling,
  getSiteAdminAvailability,
  saveSiteAdminScheduling,
  listSiteAdminBookings,
  amendSiteAdminBooking,
  updateSiteAdminBookingStatus,
  removeSiteAdminBrandingFavicon,
  removeSiteAdminBrandingLogo,
  uploadSiteAdminBrandingFavicon,
  uploadSiteAdminBrandingLogo,
} from "@/lib/sites/site-admin-client";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
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
import type { CustomerSiteBookingRecord } from "@/lib/sites/customer-site-booking-types";
import { formatBookingDateTime, formatUkDateTime } from "@/lib/sites/customer-site-booking-display";
import { DEFAULT_BOOKING_POLICY_BODY, isCustomPolicyContent } from "@/lib/sites/default-booking-policy";
import type { CustomerSiteAvailabilityResult } from "@/lib/sites/customer-site-availability";
import {
  mapAppearanceToTheme,
  resolveAppearanceMode,
  type SiteAppearanceMode,
} from "@/lib/sites/site-appearance";
import {
  BUSINESS_WEEKDAYS,
  defaultBusinessOpeningHours,
  formatBusinessOpeningHoursSummary,
  hasValidOpenBusinessDay,
  normalizeBusinessOpeningHours,
  timeToMinutes,
  validateBusinessOpeningHours,
  weekdayLabel as businessWeekdayLabel,
  type BusinessOpeningHours,
  type BusinessWeekday,
} from "@/lib/sites/customer-site-opening-hours";

type SectionKey =
  | "bookings"
  | "settings"
  | "appearance"
  | "services"
  | "staffRoles"
  | "rotaBreaks"
  | "closuresHolidays";

const SECTION_LIST: Array<{ key: SectionKey; label: string; description: string }> = [
  { key: "bookings", label: "Bookings", description: "Recent live site booking records" },
  { key: "settings", label: "Business settings", description: "Business contact and hero basics" },
  { key: "appearance", label: "Site appearance", description: "Light or dark appearance and branding assets" },
  { key: "services", label: "Services and prices", description: "Service list, prices and durations" },
  { key: "staffRoles", label: "Staff setup", description: "Team members, roles and public visibility" },
  { key: "rotaBreaks", label: "Rota & breaks", description: "Weekly rota and break windows" },
  { key: "closuresHolidays", label: "Closures & holidays", description: "Business closures and staff leave" },
];

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

type SocialPlatformDraft = { enabled: boolean; url: string };

type SettingsDraft = {
  siteDisplayName: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  openingHoursSummary: string;
  openingHours: BusinessOpeningHours;
  heroHeadline: string;
  heroSubheading: string;
  appearanceMode: SiteAppearanceMode;
  visualThemeId: string;
  colourPaletteId: string;
  currency: "GBP" | "EUR" | "USD";
  paymentProcessorSetupMode: "EXISTING_PROCESSOR" | "NEED_HELP_SETUP" | "MANUAL_RECORDING_ONLY";
  paymentProcessorName: "Stripe" | "Square" | "SumUp" | "PayPal" | "Worldpay" | "Zettle" | "Other";
  paymentProcessorAccountRef: string;
  paymentProcessorNotes: string;
  acceptCashPayments: boolean;
  acceptCardPayments: boolean;
  requireBookingPrepayment: boolean;
  allowInStorePaymentRecording: boolean;
  cancellationFullRefundNoticeDays: string;
  cancellationNoRefundWithinDays: string;
  cancellationPolicyNote: string;
  aboutPageEnabled: boolean;
  policyPageEnabled: boolean;
  aboutPageMode: "GENERAL" | "STAFF_PROFILES";
  aboutTitle: string;
  aboutBody: string;
  aboutImageOneUrl: string;
  aboutImageTwoUrl: string;
  aboutImagePlacement: "ABOVE" | "BESIDE" | "BELOW";
  aboutStaffProfilesJson: string;
  contactTitle: string;
  contactIntro: string;
  contactMapEnabled: boolean;
  contactMapNote: string;
  policyTitle: string;
  policyIntro: string;
  policyBody: string;
  policyDefaultAccepted: boolean;
  recurringPaymentsEnabled: boolean;
  customerBlockBookingsEnabled: boolean;
  socialLinks: {
    facebook: SocialPlatformDraft;
    instagram: SocialPlatformDraft;
    tiktok: SocialPlatformDraft;
    xTwitter: SocialPlatformDraft;
    linkedin: SocialPlatformDraft;
    youtube: SocialPlatformDraft;
  };
};
type ServiceDraft = {
  id?: string;
  tempKey?: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: string;
  durationMinutes: string;
  bufferAfterMinutes: string;
  active: boolean;
  sortOrder: string;
  recurringEnabled: boolean;
  recurringIntervals: Array<"WEEKLY" | "MONTHLY" | "ANNUALLY">;
  blockBookingEnabled: boolean;
  blockBookingSuggestedCounts: string;
};

type ServiceCategoryDraft = {
  id?: string;
  name: string;
  active: boolean;
  sortOrder: string;
};

type StaffRoleDraft = {
  id?: string;
  label: string;
  platformRole: string;
  active: boolean;
  sortOrder: string;
};

type StaffMemberDraft = {
  id?: string;
  firstName: string;
  lastName: string;
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

type RotaDayDraft = {
  id?: string;
  staffMemberId: string;
  weekday: WeekdayValue;
  working: boolean;
  startTime: string;
  endTime: string;
};

type BreakWindowDraft = {
  id?: string;
  staffMemberId: string;
  rotaDayId?: string;
  weekday: WeekdayValue;
  label: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

type BusinessClosureDraft = {
  id?: string;
  date: string;
  endDate: string;
  label: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  active: boolean;
  customerNote: string;
};

type StaffHolidayDraft = {
  id?: string;
  staffMemberId: string;
  date: string;
  endDate: string;
  label: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  active: boolean;
  notes: string;
};

type BookingAmendDraft = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  status: CustomerSiteBookingRecord["status"];
  serviceId: string;
  staffMemberId: string;
  preferredDate: string;
  selectedSlot: {
    date: string;
    startTime: string;
    endTime: string;
    staffMemberId: string;
    staffName: string;
  } | null;
};

function findRotaDay(
  rotaDays: RotaDayDraft[],
  staffMemberId: string,
  weekday: WeekdayValue,
): RotaDayDraft | null {
  return rotaDays.find((day) => day.staffMemberId === staffMemberId && day.weekday === weekday) ?? null;
}

function upsertRotaDayDraft(
  rows: RotaDayDraft[],
  next: RotaDayDraft,
): RotaDayDraft[] {
  const without = rows.filter((item) => !(item.staffMemberId === next.staffMemberId && item.weekday === next.weekday));
  return [...without, next];
}

function validateRotaAndBreakDrafts(
  rotaDays: RotaDayDraft[],
  breakWindows: BreakWindowDraft[],
): string[] {
  const errors: string[] = [];
  for (const day of rotaDays) {
    if (!day.working) continue;
    const label = weekdayLabel(day.weekday);
    if (!day.staffMemberId) {
      errors.push("Please select a staff member.");
      continue;
    }
    if (!day.startTime || !day.endTime) {
      errors.push(`${label} requires a start and end time.`);
      continue;
    }
    const start = timeToMinutes(day.startTime);
    const end = timeToMinutes(day.endTime);
    if (start === null || end === null) {
      errors.push(`${label}: use 24-hour HH:mm rota times, for example 09:00.`);
      continue;
    }
    if (end <= start) {
      errors.push(`${label} end time must be after start time.`);
    }
  }

  for (const window of breakWindows) {
    if (!window.active) continue;
    const label = weekdayLabel(window.weekday);
    if (!window.staffMemberId) {
      errors.push(`${label}: select a staff member for each active break window.`);
      continue;
    }
    const start = timeToMinutes(window.startTime);
    const end = timeToMinutes(window.endTime);
    if (start === null || end === null) {
      errors.push(`${label}: use 24-hour HH:mm break times, for example 12:00.`);
      continue;
    }
    if (end <= start) {
      errors.push(`${label}: break end time must be after break start time.`);
      continue;
    }
    const rotaDay = findRotaDay(rotaDays, window.staffMemberId, window.weekday);
    if (!rotaDay?.working || !rotaDay.startTime || !rotaDay.endTime) {
      errors.push(`${label}: break windows need a working rota day for the same staff member.`);
      continue;
    }
    const rotaStart = timeToMinutes(rotaDay.startTime);
    const rotaEnd = timeToMinutes(rotaDay.endTime);
    if (rotaStart !== null && rotaEnd !== null && (start < rotaStart || end > rotaEnd)) {
      errors.push(`${label}: break window must sit inside that staff member's rota hours.`);
    }
  }

  return errors;
}

function validateClosureAndLeaveDrafts(
  closures: BusinessClosureDraft[],
  holidays: StaffHolidayDraft[],
): string[] {
  const errors: string[] = [];
  for (const closure of closures) {
    if (!closure.label.trim()) errors.push("Business closures need a name/reason.");
    if (!closure.date.trim()) errors.push("Business closures need a start date.");
    const endDate = closure.endDate.trim() || closure.date.trim();
    if (closure.date.trim() && endDate && endDate < closure.date.trim()) {
      errors.push("Closure end date cannot be before start date.");
    }
    if (!closure.allDay) {
      if (!closure.startTime.trim() || !closure.endTime.trim()) {
        errors.push("Partial-day closures need start and end times.");
      } else {
        const start = timeToMinutes(closure.startTime);
        const end = timeToMinutes(closure.endTime);
        if (start === null || end === null) errors.push("Partial-day closures need valid HH:mm times.");
        if (start !== null && end !== null && endDate === closure.date.trim() && end <= start) {
          errors.push("Closure end time must be after start time for same-day partial closures.");
        }
      }
    }
  }

  for (const holiday of holidays) {
    if (!holiday.staffMemberId) errors.push("Staff leave needs a staff member.");
    if (!holiday.label.trim()) errors.push("Staff leave needs a reason.");
    if (!holiday.date.trim()) errors.push("Staff leave needs a start date.");
    const endDate = holiday.endDate.trim() || holiday.date.trim();
    if (holiday.date.trim() && endDate && endDate < holiday.date.trim()) {
      errors.push("Staff leave end date cannot be before start date.");
    }
    if (!holiday.allDay) {
      if (!holiday.startTime.trim() || !holiday.endTime.trim()) {
        errors.push("Partial-day staff leave needs start and end times.");
      } else {
        const start = timeToMinutes(holiday.startTime);
        const end = timeToMinutes(holiday.endTime);
        if (start === null || end === null) errors.push("Partial-day staff leave needs valid HH:mm times.");
        if (start !== null && end !== null && endDate === holiday.date.trim() && end <= start) {
          errors.push("Staff leave end time must be after start time for same-day partial leave.");
        }
      }
    }
  }

  return errors;
}

function rotaBusinessHoursWarning(
  rotaDay: RotaDayDraft,
  openingHours: BusinessOpeningHours,
): string | null {
  if (!rotaDay.working || !rotaDay.startTime || !rotaDay.endTime) return null;
  const businessDay = openingHours.days.find((day) => day.weekday === rotaDay.weekday);
  if (!businessDay?.open) return "This rota is outside the current business opening hours for this day.";
  const rotaStart = timeToMinutes(rotaDay.startTime);
  const rotaEnd = timeToMinutes(rotaDay.endTime);
  const businessStart = timeToMinutes(businessDay.startTime);
  const businessEnd = timeToMinutes(businessDay.endTime);
  if (rotaStart === null || rotaEnd === null || businessStart === null || businessEnd === null) return null;
  if (rotaStart < businessStart || rotaEnd > businessEnd) {
    return `This rota sits outside business hours (${businessDay.startTime}-${businessDay.endTime}). You can save it, but appointments will only be bookable inside business opening hours.`;
  }
  return null;
}

function businessDayForWeekday(openingHours: BusinessOpeningHours, weekday: WeekdayValue) {
  return openingHours.days.find((day) => day.weekday === weekday);
}

function defaultRotaTimesForWeekday(
  openingHours: BusinessOpeningHours,
  weekday: WeekdayValue,
  monday?: RotaDayDraft | null,
): { startTime: string; endTime: string } {
  if (monday?.working && monday.startTime && monday.endTime) {
    return { startTime: monday.startTime, endTime: monday.endTime };
  }
  const businessDay = businessDayForWeekday(openingHours, weekday);
  if (businessDay?.open && businessDay.startTime && businessDay.endTime) {
    return { startTime: businessDay.startTime, endTime: businessDay.endTime };
  }
  return { startTime: "09:00", endTime: "17:00" };
}

function rotaOverlapsBusinessHours(rotaDay: RotaDayDraft, openingHours: BusinessOpeningHours): boolean {
  if (!rotaDay.working || !rotaDay.startTime || !rotaDay.endTime) return false;
  const businessDay = businessDayForWeekday(openingHours, rotaDay.weekday);
  if (!businessDay?.open) return false;
  const rotaStart = timeToMinutes(rotaDay.startTime);
  const rotaEnd = timeToMinutes(rotaDay.endTime);
  const businessStart = timeToMinutes(businessDay.startTime);
  const businessEnd = timeToMinutes(businessDay.endTime);
  if (rotaStart === null || rotaEnd === null || businessStart === null || businessEnd === null) return false;
  return rotaStart < businessEnd && rotaEnd > businessStart;
}

function staffingCoverageForWeekday(
  weekday: WeekdayValue,
  rotaDays: RotaDayDraft[],
  staff: StaffMemberDraft[],
  openingHours: BusinessOpeningHours,
) {
  const businessDay = businessDayForWeekday(openingHours, weekday);
  const open = Boolean(businessDay?.open);
  const activeStaffIds = new Set(staff.filter((member) => member.active && member.id).map((member) => member.id));
  const staffCount = new Set(
    rotaDays
      .filter((day) => day.weekday === weekday && activeStaffIds.has(day.staffMemberId) && rotaOverlapsBusinessHours(day, openingHours))
      .map((day) => day.staffMemberId),
  ).size;

  if (!open) {
    return {
      staffCount,
      label: "Business closed",
      className: "border-slate-200 bg-slate-50 text-slate-600",
    };
  }
  if (staffCount === 0) {
    return {
      staffCount,
      label: "Needs cover",
      className: "border-rose-200 bg-rose-50 text-rose-800",
    };
  }
  if (staffCount === 1) {
    return {
      staffCount,
      label: "Light cover",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }
  return {
    staffCount,
    label: "Covered",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
}

function toMessage(error: string, status: number, details?: unknown): string {
  const validationMessage = validationDetailsToMessage(details);
  if (validationMessage) return validationMessage;
  if (error === "BACKEND_PERSISTENCE_NOT_CONFIGURED" || status === 503) {
    return "Backend persistence is not configured for this environment yet.";
  }
  if (error === "FORBIDDEN" || status === 403) {
    return "Access denied for this subscriber site.";
  }
  if (error === "SITE_NOT_FOUND" || status === 404) {
    return "Subscriber site was not found for this login session.";
  }
  if (error === "STORAGE_NOT_CONFIGURED") {
    return "Branding storage is not configured in this environment yet.";
  }
  if (error === "FILE_TOO_LARGE") {
    return "Selected file is too large for this upload type.";
  }
  if (error === "UNSUPPORTED_MEDIA_TYPE") {
    return "File type is not supported for this upload type.";
  }
  if (error === "VALIDATION_ERROR" || status === 400) {
    return "Some scheduling details need checking before saving.";
  }
  if (error === "BOOKING_SLOT_UNAVAILABLE" || status === 409) {
    return "That booking slot is no longer available. Please choose another time.";
  }
  if (error === "BOOKING_AMEND_NOT_ALLOWED") {
    return "Completed or cancelled bookings cannot be amended in this pass.";
  }
  return `Request failed: ${error}`;
}

function validationDetailsToMessage(details: unknown): string | null {
  if (!Array.isArray(details)) return null;
  const messages = details
    .map((item) => {
      if (!item || typeof item !== "object" || !("message" in item)) return null;
      return typeof item.message === "string" ? item.message : null;
    })
    .filter((message): message is string => Boolean(message));
  const uniqueMessages = [...new Set(messages)];
  return uniqueMessages.length > 0 ? uniqueMessages.join(" ") : null;
}

function formatAdminServicePrice(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Price not set";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatAdminDuration(value: string): string {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return "Duration not set";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0 && remainder > 0) return `${hours} hr ${remainder} mins`;
  if (hours > 0) return hours === 1 ? "1 hr" : `${hours} hrs`;
  return `${minutes} mins`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatUkDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "Date not set";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateRange(startDate: string, endDate: string): string {
  const end = endDate || startDate;
  return end === startDate ? formatUkDate(startDate) : `${formatUkDate(startDate)} to ${formatUkDate(end)}`;
}

function formatBookingPaymentStatus(booking: CustomerSiteBookingRecord): string {
  if (booking.paymentStatus === "PAID" || booking.paymentStatus === "PAYMENT_COMPLETED") return "Paid";
  if (booking.paymentStatus === "FAILED") return "Failed";
  if (booking.paymentStatus === "REFUNDED") return "Refunded";
  if (booking.paymentStatus === "PENDING" || booking.paymentStatus === "PAYMENT_REQUIRED") {
    if (booking.paymentMethod === "CASH") return "Cash/manual payment expected";
    if (booking.paymentMethod === "CARD_ONLINE") return "Online payment pending";
    return "Payment pending";
  }
  return "Payment not required";
}

function formatBookingPaymentAmount(booking: CustomerSiteBookingRecord): string {
  if (!booking.paymentAmountPence || booking.paymentAmountPence <= 0) return "Not set";
  const currency = booking.paymentCurrency || "GBP";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(booking.paymentAmountPence / 100);
}

function toBookingAmendDraft(booking: CustomerSiteBookingRecord): BookingAmendDraft {
  return {
    customerName: booking.customerName,
    customerEmail: booking.customerEmail ?? "",
    customerPhone: booking.customerPhone ?? "",
    notes: booking.notes ?? "",
    status: booking.status,
    serviceId: booking.serviceId ?? "",
    staffMemberId: booking.staffMemberId ?? "",
    preferredDate: booking.preferredDate ?? todayIso(),
    selectedSlot: booking.preferredDate && booking.preferredTime
      ? {
          date: booking.preferredDate,
          startTime: booking.preferredTime,
          endTime: booking.endDateTime ? new Date(booking.endDateTime).toISOString().slice(11, 16) : booking.preferredTime,
          staffMemberId: booking.staffMemberId ?? "",
          staffName: booking.staffName ?? "",
        }
      : null,
  };
}

function splitActiveFutureAndPast<T extends { active: boolean; date: string; endDate: string }>(items: T[]) {
  const today = todayIso();
  return {
    currentUpcoming: items.filter((item) => item.active && (item.endDate || item.date) >= today),
    pastOrInactive: items.filter((item) => !item.active || (item.endDate || item.date) < today),
  };
}


type SettingsSocialKey = keyof SettingsDraft["socialLinks"];

function emptySocialDraft(): SettingsDraft["socialLinks"] {
  return {
    facebook: { enabled: false, url: "" },
    instagram: { enabled: false, url: "" },
    tiktok: { enabled: false, url: "" },
    xTwitter: { enabled: false, url: "" },
    linkedin: { enabled: false, url: "" },
    youtube: { enabled: false, url: "" },
  };
}

function parseSocialDraft(input: unknown): SettingsDraft["socialLinks"] {
  const base = emptySocialDraft();
  if (!input || typeof input !== "object") return base;
  const source = input as Record<string, unknown>;
  const keys: SettingsSocialKey[] = ["facebook", "instagram", "tiktok", "xTwitter", "linkedin", "youtube"];
  for (const key of keys) {
    const value = source[key];
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    base[key] = {
      enabled: row.enabled === true,
      url: typeof row.url === "string" ? row.url : "",
    };
  }
  return base;
}
function toSettingsDraft(settings: PersistedCustomerSiteSettings | null): SettingsDraft {
  const openingHours = normalizeBusinessOpeningHours(settings?.openingHoursJson ?? null);
  return {
    siteDisplayName: settings?.siteDisplayName ?? "",
    businessName: settings?.businessName ?? "",
    phone: settings?.phone ?? "",
    email: settings?.email ?? "",
    address: settings?.address ?? "",
    openingHoursSummary: settings?.openingHoursSummary ?? formatBusinessOpeningHoursSummary(openingHours),
    openingHours,
    heroHeadline: settings?.heroHeadline ?? "",
    heroSubheading: settings?.heroSubheading ?? "",
    appearanceMode: resolveAppearanceMode(
      settings?.visualThemeId,
      settings?.colourPaletteId,
    ),
    visualThemeId: settings?.visualThemeId ?? "",
    colourPaletteId: settings?.colourPaletteId ?? "",
    currency: (settings?.currency as "GBP" | "EUR" | "USD" | null) ?? "GBP",
    paymentProcessorSetupMode: settings?.paymentProcessorSetupMode ?? "MANUAL_RECORDING_ONLY",
    paymentProcessorName: settings?.paymentProcessorName ?? "Stripe",
    paymentProcessorAccountRef: settings?.paymentProcessorAccountRef ?? "",
    paymentProcessorNotes: settings?.paymentProcessorNotes ?? "",
    acceptCashPayments: settings?.acceptCashPayments ?? false,
    acceptCardPayments: settings?.acceptCardPayments ?? true,
    requireBookingPrepayment: settings?.requireBookingPrepayment ?? false,
    allowInStorePaymentRecording: settings?.allowInStorePaymentRecording ?? false,
    cancellationFullRefundNoticeDays: String(settings?.cancellationFullRefundNoticeDays ?? 1),
    cancellationNoRefundWithinDays: String(settings?.cancellationNoRefundWithinDays ?? 1),
    cancellationPolicyNote: settings?.cancellationPolicyNote ?? "",
    aboutPageEnabled: settings?.aboutPageEnabled ?? false,
    policyPageEnabled: settings?.policyPageEnabled ?? true,
    aboutPageMode: settings?.aboutPageMode ?? "GENERAL",
    aboutTitle: settings?.aboutTitle ?? "",
    aboutBody: settings?.aboutBody ?? "",
    aboutImageOneUrl: settings?.aboutImageOneUrl ?? "",
    aboutImageTwoUrl: settings?.aboutImageTwoUrl ?? "",
    aboutImagePlacement: settings?.aboutImagePlacement ?? "ABOVE",
    aboutStaffProfilesJson: settings?.aboutStaffProfilesJson
      ? JSON.stringify(settings.aboutStaffProfilesJson, null, 2)
      : "",
    contactTitle: settings?.contactTitle ?? "",
    contactIntro: settings?.contactIntro ?? "",
    contactMapEnabled: settings?.contactMapEnabled ?? true,
    contactMapNote: settings?.contactMapNote ?? "",
    policyTitle: settings?.policyTitle ?? "",
    policyIntro: settings?.policyIntro ?? "",
    policyBody: settings?.policyBody ?? "",
    policyDefaultAccepted: settings?.policyDefaultAccepted ?? false,
    recurringPaymentsEnabled: settings?.recurringPaymentsEnabled ?? false,
    customerBlockBookingsEnabled: settings?.customerBlockBookingsEnabled ?? false,
    socialLinks: parseSocialDraft(settings?.socialLinks),
  };
}
function toServiceDraft(service: PersistedCustomerSiteService): ServiceDraft {
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
    recurringEnabled: service.recurringEnabled ?? false,
    recurringIntervals: Array.isArray(service.recurringIntervals)
      ? service.recurringIntervals.filter(
          (item): item is "WEEKLY" | "MONTHLY" | "ANNUALLY" =>
            item === "WEEKLY" || item === "MONTHLY" || item === "ANNUALLY",
        ).slice(0, 1)
      : [],
    blockBookingEnabled: service.blockBookingEnabled ?? false,
    blockBookingSuggestedCounts: Array.isArray(service.blockBookingSuggestedCounts)
      ? service.blockBookingSuggestedCounts.join(", ")
      : "",
  };
}

function toServiceCategoryDraft(category: PersistedCustomerSiteServiceCategory): ServiceCategoryDraft {
  return {
    id: category.id,
    name: category.name,
    active: category.active,
    sortOrder: String(category.sortOrder),
  };
}

function serviceDraftKey(service: ServiceDraft, index: number): string {
  return service.id ?? service.tempKey ?? `service-${index}`;
}

function toRoleDraft(role: CustomerSiteStaffRoleRecord): StaffRoleDraft {
  return {
    id: role.id,
    label: role.label,
    platformRole: "",
    active: role.active,
    sortOrder: String(role.sortOrder),
  };
}

function splitStaffName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function buildStaffDisplayName(staff: StaffMemberDraft): string {
  return (
    staff.displayName.trim() ||
    [staff.firstName.trim(), staff.lastName.trim()].filter(Boolean).join(" ").trim()
  );
}

function toStaffDraft(staff: CustomerSiteStaffMemberRecord): StaffMemberDraft {
  const nameParts = splitStaffName(staff.displayName);
  return {
    id: staff.id,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    roleId: staff.roleId ?? "",
    displayName: staff.displayName,
    roleLabel: staff.roleLabel ?? "",
    email: staff.email ?? "",
    phone: staff.phone ?? "",
    bio: staff.bio ?? "",
    active: staff.active,
    customerSelectable: staff.customerSelectable,
    isSuperUser: staff.isSuperUser,
    availableWeekdays: staff.availableWeekdays ?? [],
    notes: staff.notes ?? "",
    sortOrder: String(staff.sortOrder),
  };
}

function toRotaDayDraft(day: CustomerSiteStaffRotaDayRecord): RotaDayDraft {
  return {
    id: day.id,
    staffMemberId: day.staffMemberId,
    weekday: day.weekday,
    working: day.working,
    startTime: day.working ? day.startTime ?? "" : "",
    endTime: day.working ? day.endTime ?? "" : "",
  };
}

function toBreakWindowDraft(window: CustomerSiteStaffBreakWindowRecord): BreakWindowDraft {
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

function toBusinessClosureDraft(closure: CustomerSiteBusinessClosureRecord): BusinessClosureDraft {
  return {
    id: closure.id,
    date: closure.date,
    endDate: closure.endDate ?? closure.date,
    label: closure.label,
    allDay: closure.allDay,
    startTime: closure.startTime ?? "",
    endTime: closure.endTime ?? "",
    active: closure.active,
    customerNote: closure.customerNote ?? "",
  };
}

function toStaffHolidayDraft(holiday: CustomerSiteStaffHolidayRecord): StaffHolidayDraft {
  return {
    id: holiday.id,
    staffMemberId: holiday.staffMemberId,
    date: holiday.date,
    endDate: holiday.endDate ?? holiday.date,
    label: holiday.label,
    allDay: holiday.allDay,
    startTime: holiday.startTime ?? "",
    endTime: holiday.endTime ?? "",
    active: holiday.active,
    notes: holiday.notes ?? "",
  };
}

export function SiteAdminDashboard({ siteSlug }: { siteSlug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("settings");
  const [expandedServiceKey, setExpandedServiceKey] = useState<string | null>(null);

  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>(() => toSettingsDraft(null));
  const [persistedSettings, setPersistedSettings] = useState<PersistedCustomerSiteSettings | null>(null);
  const [serviceCategoriesDraft, setServiceCategoriesDraft] = useState<ServiceCategoryDraft[]>([]);
  const [servicesDraft, setServicesDraft] = useState<ServiceDraft[]>([]);
  const [rolesDraft, setRolesDraft] = useState<StaffRoleDraft[]>([]);
  const [staffDraft, setStaffDraft] = useState<StaffMemberDraft[]>([]);
  const [rotaDaysDraft, setRotaDaysDraft] = useState<RotaDayDraft[]>([]);
  const [breakWindowsDraft, setBreakWindowsDraft] = useState<BreakWindowDraft[]>([]);
  const [businessClosuresDraft, setBusinessClosuresDraft] = useState<BusinessClosureDraft[]>([]);
  const [staffHolidaysDraft, setStaffHolidaysDraft] = useState<StaffHolidayDraft[]>([]);
  const [bookings, setBookings] = useState<CustomerSiteBookingRecord[]>([]);
  const [selectedSchedulingStaffId, setSelectedSchedulingStaffId] = useState("");
  const [availabilityServiceId, setAvailabilityServiceId] = useState("");
  const [availabilityStaffId, setAvailabilityStaffId] = useState("");
  const [availabilityDate, setAvailabilityDate] = useState(todayIso());
  const [availabilityResult, setAvailabilityResult] = useState<CustomerSiteAvailabilityResult | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [bookingAmendDraft, setBookingAmendDraft] = useState<BookingAmendDraft | null>(null);
  const [bookingAmendAvailability, setBookingAmendAvailability] = useState<CustomerSiteAvailabilityResult | null>(null);
  const [bookingAmendLoading, setBookingAmendLoading] = useState(false);

  const selectedStaff = useMemo(
    () => staffDraft.find((item) => item.id === selectedSchedulingStaffId) ?? null,
    [selectedSchedulingStaffId, staffDraft],
  );
  const serviceCategoryById = useMemo(
    () => new Map(serviceCategoriesDraft.filter((category) => category.id).map((category) => [category.id!, category])),
    [serviceCategoriesDraft],
  );
  const staffById = useMemo(
    () => new Map(staffDraft.filter((staff) => staff.id).map((staff) => [staff.id!, staff])),
    [staffDraft],
  );

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setMessage(null);
      const [
        settingsResult,
        servicesResult,
        rolesResult,
        staffResult,
        schedulingResult,
        bookingsResult,
      ] = await Promise.all([
        getSiteAdminSettings(siteSlug),
        getSiteAdminServices(siteSlug),
        listSiteAdminStaffRoles(siteSlug),
        listSiteAdminStaff(siteSlug),
        getSiteAdminScheduling(siteSlug),
        listSiteAdminBookings(siteSlug, 25),
      ]);
      if (!active) return;

      if (!settingsResult.ok) {
        setMessage(toMessage(settingsResult.error, settingsResult.status));
        setLoading(false);
        return;
      }
      if (!servicesResult.ok) {
        setMessage(toMessage(servicesResult.error, servicesResult.status));
        setLoading(false);
        return;
      }
      if (!rolesResult.ok) {
        setMessage(toMessage(rolesResult.error, rolesResult.status));
        setLoading(false);
        return;
      }
      if (!staffResult.ok) {
        setMessage(toMessage(staffResult.error, staffResult.status));
        setLoading(false);
        return;
      }
      if (!schedulingResult.ok) {
        setMessage(toMessage(schedulingResult.error, schedulingResult.status));
        setLoading(false);
        return;
      }
      if (!bookingsResult.ok) {
        setMessage(toMessage(bookingsResult.error, bookingsResult.status));
        setLoading(false);
        return;
      }

      setSettingsDraft(toSettingsDraft(settingsResult.settings));
      setPersistedSettings(settingsResult.settings);
      setServiceCategoriesDraft(servicesResult.categories.map(toServiceCategoryDraft));
      setServicesDraft(servicesResult.services.map(toServiceDraft));
      setRolesDraft(rolesResult.roles.map(toRoleDraft));
      setStaffDraft(staffResult.staff.map(toStaffDraft));
      setRotaDaysDraft(schedulingResult.scheduling.rotaDays.map(toRotaDayDraft));
      setBreakWindowsDraft(schedulingResult.scheduling.breakWindows.map(toBreakWindowDraft));
      setBusinessClosuresDraft(schedulingResult.scheduling.businessClosures.map(toBusinessClosureDraft));
      setStaffHolidaysDraft(schedulingResult.scheduling.staffHolidays.map(toStaffHolidayDraft));
      setBookings(bookingsResult.bookings);
      setAvailabilityServiceId(servicesResult.services.find((service) => service.active)?.id ?? "");
      setAvailabilityStaffId("");
      setAvailabilityResult(null);
      setSelectedSchedulingStaffId(
        staffResult.staff[0]?.id ??
          schedulingResult.scheduling.rotaDays[0]?.staffMemberId ??
          schedulingResult.scheduling.staffHolidays[0]?.staffMemberId ??
          "",
      );
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [siteSlug]);

  async function saveSettings() {
    setMessage("Saving site settings...");
    let aboutStaffProfilesJson: unknown = null;
    if (settingsDraft.aboutStaffProfilesJson.trim()) {
      try {
        aboutStaffProfilesJson = JSON.parse(settingsDraft.aboutStaffProfilesJson);
      } catch {
        setMessage("About staff profiles JSON is invalid. Please fix it before saving.");
        return;
      }
    }

    const appearance = mapAppearanceToTheme(settingsDraft.appearanceMode);
    const openingHoursSummary = formatBusinessOpeningHoursSummary(settingsDraft.openingHours);
    const result = await patchSiteAdminSettings(siteSlug, {
      siteDisplayName: settingsDraft.siteDisplayName || null,
      businessName: settingsDraft.businessName || null,
      phone: settingsDraft.phone || null,
      email: settingsDraft.email || null,
      address: settingsDraft.address || null,
      openingHoursSummary: openingHoursSummary || settingsDraft.openingHoursSummary || null,
      openingHoursJson: settingsDraft.openingHours,
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
      cancellationFullRefundNoticeDays: settingsDraft.cancellationFullRefundNoticeDays.trim()
        ? Number(settingsDraft.cancellationFullRefundNoticeDays)
        : null,
      cancellationNoRefundWithinDays: settingsDraft.cancellationNoRefundWithinDays.trim()
        ? Number(settingsDraft.cancellationNoRefundWithinDays)
        : null,
      cancellationPolicyNote: settingsDraft.cancellationPolicyNote.trim() || null,
      aboutPageEnabled: settingsDraft.aboutPageEnabled,
      policyPageEnabled: settingsDraft.policyPageEnabled,
      aboutPageMode: settingsDraft.aboutPageMode,
      aboutTitle: settingsDraft.aboutTitle.trim() || null,
      aboutBody: settingsDraft.aboutBody.trim() || null,
      aboutImageOneUrl: settingsDraft.aboutImageOneUrl.trim() || null,
      aboutImageTwoUrl: settingsDraft.aboutImageTwoUrl.trim() || null,
      aboutImagePlacement: settingsDraft.aboutImagePlacement,
      aboutStaffProfilesJson,
      contactTitle: settingsDraft.contactTitle.trim() || null,
      contactIntro: settingsDraft.contactIntro.trim() || null,
      contactMapEnabled: settingsDraft.contactMapEnabled,
      contactMapNote: settingsDraft.contactMapNote.trim() || null,
      policyTitle: settingsDraft.policyTitle.trim() || null,
      policyIntro: settingsDraft.policyIntro.trim() || null,
      policyBody: settingsDraft.policyBody.trim() || null,
      policyDefaultAccepted: settingsDraft.policyDefaultAccepted,
      socialLinks: settingsDraft.socialLinks,
      recurringPaymentsEnabled: settingsDraft.recurringPaymentsEnabled,
      customerBlockBookingsEnabled: settingsDraft.customerBlockBookingsEnabled,
    });
    if (!result.ok) {
      if (result.error === "VALIDATION_ERROR") {
        setMessage(validationDetailsToMessage(result.details) ?? "Please check the rota times before saving.");
        return;
      }
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setSettingsDraft(toSettingsDraft(result.settings));
    setPersistedSettings(result.settings);
    setMessage("Site settings saved.");
  }

  async function saveOpeningHours() {
    const validationErrors = validateBusinessOpeningHours(settingsDraft.openingHours);
    if (validationErrors.length > 0) {
      setMessage(validationErrors.join(" "));
      return;
    }
    const openingHoursSummary = formatBusinessOpeningHoursSummary(settingsDraft.openingHours);
    setMessage("Saving opening hours...");
    const result = await patchSiteAdminSettings(siteSlug, {
      openingHoursSummary: openingHoursSummary || null,
      openingHoursJson: settingsDraft.openingHours,
    });
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setSettingsDraft(toSettingsDraft(result.settings));
    setPersistedSettings(result.settings);
    setMessage(
      hasValidOpenBusinessDay(settingsDraft.openingHours)
        ? "Opening hours saved. Your public site now shows your normal business hours."
        : "Opening hours saved. No open days are currently set.",
    );
    router.refresh();
  }

  async function uploadLogo(file: File) {
    setMessage("Uploading logo...");
    const result = await uploadSiteAdminBrandingLogo(siteSlug, file);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setPersistedSettings(result.settings);
    setMessage("Logo uploaded.");
  }

  async function removeLogo() {
    setMessage("Removing logo...");
    const result = await removeSiteAdminBrandingLogo(siteSlug);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setPersistedSettings(result.settings);
    setMessage("Logo removed.");
  }

  async function uploadFavicon(file: File) {
    setMessage("Uploading favicon...");
    const result = await uploadSiteAdminBrandingFavicon(siteSlug, file);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setPersistedSettings(result.settings);
    setMessage("Favicon uploaded.");
  }

  async function removeFavicon() {
    setMessage("Removing favicon...");
    const result = await removeSiteAdminBrandingFavicon(siteSlug);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setPersistedSettings(result.settings);
    setMessage("Favicon removed.");
  }

  async function saveServices() {
    setMessage("Saving services...");
    const invalidService = servicesDraft.find((service) => service.name.trim().length === 0);
    if (invalidService) {
      setMessage("Please add a service name before saving.");
      return;
    }
    const invalidCategory = serviceCategoriesDraft.find((category) => category.name.trim().length === 0);
    if (invalidCategory) {
      setMessage("Please add a category name before saving, or remove the blank category.");
      return;
    }
    const result = await putSiteAdminServices(
      siteSlug,
      servicesDraft.map((service, index) => ({
        id: service.id,
        categoryId: service.categoryId || null,
        name: service.name.trim(),
        description: service.description.trim() || null,
        basePrice: service.basePrice.trim() ? Number(service.basePrice) : null,
        durationMinutes: service.durationMinutes.trim() ? Number(service.durationMinutes) : null,
        bufferAfterMinutes: service.bufferAfterMinutes.trim()
          ? Number(service.bufferAfterMinutes)
          : null,
        active: service.active,
        sortOrder: service.sortOrder.trim() ? Number(service.sortOrder) : index,
        rolePriceOverrides: null,
        recurringEnabled: service.recurringEnabled,
        recurringIntervals: service.recurringIntervals.slice(0, 1),
        blockBookingEnabled: service.blockBookingEnabled,
        blockBookingSuggestedCounts: service.blockBookingSuggestedCounts
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value >= 2 && value <= 52),
      })),
      serviceCategoriesDraft.map((category, index) => ({
        id: category.id,
        name: category.name.trim(),
        active: category.active,
        sortOrder: category.sortOrder.trim() ? Number(category.sortOrder) : index,
      })),
    );
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setServiceCategoriesDraft(result.categories.map(toServiceCategoryDraft));
    setServicesDraft(result.services.map(toServiceDraft));
    setExpandedServiceKey(null);
    const activeCount = result.services.filter((service) => service.active).length;
    setMessage(
      activeCount > 0
        ? `Services saved. ${activeCount} active service${activeCount === 1 ? "" : "s"} will show on your public site.`
        : "Services saved. No active services are currently visible on your public site.",
    );
    router.refresh();
  }

  async function saveStaffAndRoles() {
    setMessage("Saving staff roles...");
    const rolesResult = await saveSiteAdminStaffRoles(
      siteSlug,
      rolesDraft.map((role, index) => ({
        id: role.id,
        label: role.label.trim(),
        platformRole: null,
        active: role.active,
        sortOrder: role.sortOrder.trim() ? Number(role.sortOrder) : index,
      })),
    );
    if (!rolesResult.ok) {
      setMessage(toMessage(rolesResult.error, rolesResult.status));
      return;
    }

    setMessage("Saving staff...");
    const invalidStaff = staffDraft.find((staff) => !buildStaffDisplayName(staff));
    if (invalidStaff) {
      setMessage("Please add at least a first name, last name, or display name for each staff member before saving.");
      return;
    }
    const staffResult = await saveSiteAdminStaff(
      siteSlug,
      staffDraft.map((staff, index) => ({
        id: staff.id,
        roleId: staff.roleId.trim() || null,
        displayName: buildStaffDisplayName(staff),
        roleLabel: staff.roleLabel.trim() || null,
        email: staff.email.trim() || null,
        phone: staff.phone.trim() || null,
        bio: staff.bio.trim() || null,
        active: staff.active,
        customerSelectable: staff.customerSelectable,
        isSuperUser: staff.isSuperUser,
        availableWeekdays: staff.availableWeekdays,
        notes: staff.notes.trim() || null,
        sortOrder: staff.sortOrder.trim() ? Number(staff.sortOrder) : index,
      })),
    );
    if (!staffResult.ok) {
      setMessage(toMessage(staffResult.error, staffResult.status));
      return;
    }

    setRolesDraft(rolesResult.roles.map(toRoleDraft));
    setStaffDraft(staffResult.staff.map(toStaffDraft));
    if (!selectedSchedulingStaffId && staffResult.staff[0]?.id) {
      setSelectedSchedulingStaffId(staffResult.staff[0].id);
    }
    setMessage("Staff roles and staff members saved.");
  }

  async function saveScheduling() {
    const validationErrors = [
      ...validateRotaAndBreakDrafts(rotaDaysDraft, breakWindowsDraft),
      ...validateClosureAndLeaveDrafts(businessClosuresDraft, staffHolidaysDraft),
    ];
    if (validationErrors.length > 0) {
      setMessage(validationErrors.join(" "));
      return;
    }
    setMessage("Saving scheduling...");
    const result = await saveSiteAdminScheduling(siteSlug, {
      rotaDays: rotaDaysDraft.map((day) => ({
        id: day.id,
        staffMemberId: day.staffMemberId,
        weekday: day.weekday,
        working: day.working,
        startTime: day.working ? day.startTime.trim() || null : null,
        endTime: day.working ? day.endTime.trim() || null : null,
      })),
      breakWindows: breakWindowsDraft.map((window) => ({
        id: window.id,
        staffMemberId: window.staffMemberId,
        rotaDayId: window.rotaDayId ?? null,
        weekday: window.weekday,
        label: window.label.trim() || null,
        startTime: window.startTime.trim(),
        endTime: window.endTime.trim(),
        active: window.active,
      })),
      businessClosures: businessClosuresDraft.map((closure) => ({
        id: closure.id,
        date: closure.date.trim(),
        endDate: closure.endDate.trim() || closure.date.trim(),
        label: closure.label.trim(),
        allDay: closure.allDay,
        startTime: closure.allDay ? null : closure.startTime.trim() || null,
        endTime: closure.allDay ? null : closure.endTime.trim() || null,
        active: closure.active,
        customerNote: closure.customerNote.trim() || null,
      })),
      staffHolidays: staffHolidaysDraft.map((holiday) => ({
        id: holiday.id,
        staffMemberId: holiday.staffMemberId,
        date: holiday.date.trim(),
        endDate: holiday.endDate.trim() || holiday.date.trim(),
        label: holiday.label.trim(),
        allDay: holiday.allDay,
        startTime: holiday.allDay ? null : holiday.startTime.trim() || null,
        endTime: holiday.allDay ? null : holiday.endTime.trim() || null,
        active: holiday.active,
        notes: holiday.notes.trim() || null,
      })),
    });
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status, result.details));
      return;
    }
    setRotaDaysDraft(result.scheduling.rotaDays.map(toRotaDayDraft));
    setBreakWindowsDraft(result.scheduling.breakWindows.map(toBreakWindowDraft));
    setBusinessClosuresDraft(result.scheduling.businessClosures.map(toBusinessClosureDraft));
    setStaffHolidaysDraft(result.scheduling.staffHolidays.map(toStaffHolidayDraft));
    const activeRotaCount = result.scheduling.rotaDays.filter((day) => day.working && day.startTime && day.endTime).length;
    setMessage(activeRotaCount > 0 ? "Staff rota saved." : "Scheduling saved. No working rota days are currently set.");
    router.refresh();
  }

  async function previewAvailability() {
    if (!availabilityServiceId) {
      setMessage("Select a service before previewing availability.");
      return;
    }
    if (!availabilityDate) {
      setMessage("Select a date before previewing availability.");
      return;
    }
    setAvailabilityLoading(true);
    setMessage("Checking booking availability...");
    const result = await getSiteAdminAvailability(siteSlug, {
      serviceId: availabilityServiceId,
      staffId: availabilityStaffId || null,
      date: availabilityDate,
    });
    setAvailabilityLoading(false);
    if (!result.ok) {
      setAvailabilityResult(null);
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setAvailabilityResult(result.availability);
    setMessage(result.availability.slots.length > 0 ? "Availability preview generated." : "No slots found for that setup/date.");
  }

  async function updateBookingStatus(bookingId: string, status: CustomerSiteBookingRecord["status"], paymentStatus?: CustomerSiteBookingRecord["paymentStatus"]) {
    setMessage(`Updating booking status to ${status.toLowerCase()}...`);
    const result = await updateSiteAdminBookingStatus(siteSlug, { bookingId, status, paymentStatus });
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status, result.details));
      return;
    }
    setBookings((current) => current.map((booking) => (booking.id === bookingId ? result.booking : booking)));
    setMessage(`Booking status updated to ${status}.`);
    setAvailabilityResult(null);
    router.refresh();
  }

  function startBookingAmend(booking: CustomerSiteBookingRecord) {
    setEditingBookingId(booking.id);
    setBookingAmendDraft(toBookingAmendDraft(booking));
    setBookingAmendAvailability(null);
    setMessage(null);
  }

  async function checkBookingAmendAvailability() {
    if (!editingBookingId || !bookingAmendDraft) return;
    if (!bookingAmendDraft.serviceId) {
      setMessage("Select a service before checking reschedule times.");
      return;
    }
    if (!bookingAmendDraft.preferredDate) {
      setMessage("Select a date before checking reschedule times.");
      return;
    }
    setBookingAmendLoading(true);
    setMessage("Checking reschedule availability...");
    const result = await getSiteAdminAvailability(siteSlug, {
      serviceId: bookingAmendDraft.serviceId,
      staffId: bookingAmendDraft.staffMemberId || null,
      date: bookingAmendDraft.preferredDate,
      excludeBookingId: editingBookingId,
    });
    setBookingAmendLoading(false);
    if (!result.ok) {
      setBookingAmendAvailability(null);
      setMessage(toMessage(result.error, result.status, result.details));
      return;
    }
    setBookingAmendAvailability(result.availability);
    setBookingAmendDraft((current) => current ? { ...current, selectedSlot: null } : current);
    setMessage(result.availability.slots.length > 0 ? "Choose a reschedule time below." : "No available reschedule times found.");
  }

  async function saveBookingAmend(booking: CustomerSiteBookingRecord) {
    if (!bookingAmendDraft) return;
    if (!bookingAmendDraft.customerName.trim()) {
      setMessage("Customer name is required.");
      return;
    }
    if (!bookingAmendDraft.customerEmail.trim()) {
      setMessage("Customer email is required.");
      return;
    }
    if (!bookingAmendDraft.customerPhone.trim()) {
      setMessage("Customer phone is required.");
      return;
    }
    const rescheduleChanged =
      bookingAmendDraft.serviceId !== (booking.serviceId ?? "") ||
      bookingAmendDraft.staffMemberId !== (booking.staffMemberId ?? "") ||
      bookingAmendDraft.preferredDate !== (booking.preferredDate ?? "") ||
      Boolean(bookingAmendDraft.selectedSlot && bookingAmendDraft.selectedSlot.startTime !== booking.preferredTime);
    if (rescheduleChanged && !bookingAmendDraft.selectedSlot) {
      setMessage("Choose an available reschedule slot before saving date, service, or staff changes.");
      return;
    }
    setMessage("Saving booking changes...");
    const amendInput: Parameters<typeof amendSiteAdminBooking>[1] = {
      bookingId: booking.id,
      customerName: bookingAmendDraft.customerName.trim(),
      customerEmail: bookingAmendDraft.customerEmail.trim(),
      customerPhone: bookingAmendDraft.customerPhone.trim(),
      notes: bookingAmendDraft.notes.trim() || null,
      status: bookingAmendDraft.status,
    };
    if (rescheduleChanged && bookingAmendDraft.selectedSlot) {
      amendInput.serviceId = bookingAmendDraft.serviceId;
      amendInput.staffMemberId = bookingAmendDraft.selectedSlot.staffMemberId;
      amendInput.preferredDate = bookingAmendDraft.selectedSlot.date;
      amendInput.preferredTime = bookingAmendDraft.selectedSlot.startTime;
    }
    const result = await amendSiteAdminBooking(siteSlug, amendInput);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status, result.details));
      return;
    }
    setBookings((current) => current.map((item) => (item.id === booking.id ? result.booking : item)));
    setEditingBookingId(null);
    setBookingAmendDraft(null);
    setBookingAmendAvailability(null);
    setAvailabilityResult(null);
    setMessage("Booking updated.");
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading business admin data...</p>;
  }
  const closureGroups = splitActiveFutureAndPast(businessClosuresDraft);
  const staffLeaveGroups = splitActiveFutureAndPast(staffHolidaysDraft);
  const hasCustomPolicy = isCustomPolicyContent(settingsDraft);
  const policyNeedsReview = !hasCustomPolicy && !settingsDraft.policyDefaultAccepted;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">This is your business admin area</h2>
        <p className="mt-2 text-sm text-slate-600">
          Manage the live data for your subscriber site. Your account is tenant-scoped to this site only.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_LIST.map((section) => {
            const active = activeSection === section.key;
            return (
              <button
                key={section.key}
                type="button"
                className={`rounded-xl border px-3 py-3 text-left ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
                }`}
                onClick={() => setActiveSection(section.key)}
              >
                <p className="text-sm font-semibold">{section.label}</p>
                <p className={`mt-1 text-xs ${active ? "text-slate-200" : "text-slate-600"}`}>
                  {section.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {activeSection === "settings" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Site settings</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Hero headline
              <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.heroHeadline} onChange={(event) => setSettingsDraft((current) => ({ ...current, heroHeadline: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Hero subheading
              <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.heroSubheading} onChange={(event) => setSettingsDraft((current) => ({ ...current, heroSubheading: event.target.value }))} />
            </label>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h4 className="text-sm font-semibold text-slate-900">Business logo</h4>
              <p className="mt-1 text-xs text-slate-600">
                Recommended PNG or SVG. 512 x 512 px square icon or 1200 x 400 px wide logo. Max 1MB.
              </p>
              {persistedSettings?.logoUrl ? (
                <img
                  src={persistedSettings.logoUrl}
                  alt={persistedSettings.logoFileName ?? "Business logo"}
                  className="mt-2 h-16 w-auto max-w-full rounded-md border border-slate-200 bg-white p-1"
                />
              ) : (
                <p className="mt-2 text-xs text-slate-600">No logo uploaded yet.</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <label className={`${outlineButtonClass} ${smallButtonClass} cursor-pointer`}>
                  Upload logo
                  <input
                    type="file"
                    accept=".png,.svg,.jpg,.jpeg,.webp,image/png,image/svg+xml,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadLogo(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {persistedSettings?.logoUrl ? (
                  <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void removeLogo()}>
                    Remove logo
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h4 className="text-sm font-semibold text-slate-900">Favicon</h4>
              <p className="mt-1 text-xs text-slate-600">
                Recommended PNG or ICO. 512 x 512 px source. Max 512KB.
              </p>
              {persistedSettings?.faviconUrl ? (
                <img
                  src={persistedSettings.faviconUrl}
                  alt={persistedSettings.faviconFileName ?? "Favicon"}
                  className="mt-2 h-10 w-10 rounded-md border border-slate-200 bg-white p-1"
                />
              ) : (
                <p className="mt-2 text-xs text-slate-600">No favicon uploaded yet.</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <label className={`${outlineButtonClass} ${smallButtonClass} cursor-pointer`}>
                  Upload favicon
                  <input
                    type="file"
                    accept=".png,.ico,.svg,image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadFavicon(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {persistedSettings?.faviconUrl ? (
                  <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void removeFavicon()}>
                    Remove favicon
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Payments and policies</h4>
            <p className="mt-1 text-xs text-slate-600">
              This records how your business plans to take payments. It does not yet connect to Stripe/Square/other
              provider APIs in this phase.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Do not enter API keys or passwords here.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                Payment setup mode
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settingsDraft.paymentProcessorSetupMode}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      paymentProcessorSetupMode: event.target.value as SettingsDraft["paymentProcessorSetupMode"],
                    }))
                  }
                >
                  <option value="EXISTING_PROCESSOR">I already have a payment processor</option>
                  <option value="NEED_HELP_SETUP">I need help setting one up</option>
                  <option value="MANUAL_RECORDING_ONLY">I only want to record payments manually for now</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Payment provider
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settingsDraft.paymentProcessorName}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      paymentProcessorName: event.target.value as SettingsDraft["paymentProcessorName"],
                    }))
                  }
                >
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
                Provider account reference/email
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settingsDraft.paymentProcessorAccountRef}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      paymentProcessorAccountRef: event.target.value,
                    }))
                  }
                />
                <span className="mt-1 block text-[11px] font-normal text-slate-600">
                  Do not enter API keys or passwords.
                </span>
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                Setup notes
                <textarea
                  className="mt-1 min-h-[72px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settingsDraft.paymentProcessorNotes}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      paymentProcessorNotes: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={settingsDraft.acceptCardPayments}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({ ...current, acceptCardPayments: event.target.checked }))
                  }
                />
                Accept card payments
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={settingsDraft.acceptCashPayments}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({ ...current, acceptCashPayments: event.target.checked }))
                  }
                />
                Accept cash payments
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={settingsDraft.requireBookingPrepayment}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      requireBookingPrepayment: event.target.checked,
                    }))
                  }
                />
                Require prepayment for online bookings
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={settingsDraft.allowInStorePaymentRecording}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      allowInStorePaymentRecording: event.target.checked,
                    }))
                  }
                />
                Allow in-store payment recording
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={settingsDraft.recurringPaymentsEnabled}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      recurringPaymentsEnabled: event.target.checked,
                    }))
                  }
                />
                Enable recurring services/payments options
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={settingsDraft.customerBlockBookingsEnabled}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      customerBlockBookingsEnabled: event.target.checked,
                    }))
                  }
                />
                Allow customer block bookings
              </label>
            </div>
            <p className="mt-2 text-[11px] text-slate-600">
              Recommended: keep card prepayment enabled for online bookings. Cash payments can increase no-show risk.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">
                Full refund notice period (days)
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settingsDraft.cancellationFullRefundNoticeDays}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      cancellationFullRefundNoticeDays: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                No refund within (days)
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settingsDraft.cancellationNoRefundWithinDays}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      cancellationNoRefundWithinDays: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                Cancellation policy note
                <textarea
                  className="mt-1 min-h-[72px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settingsDraft.cancellationPolicyNote}
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      cancellationPolicyNote: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <p className="mt-2 text-[11px] text-slate-600">
              Public booking will require customers to confirm they have read and accepted this cancellation/refund
              policy before completing bookings (full enforcement in booking journey milestone).
            </p>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold text-slate-900">Recurring payment issues</p>
              <p className="mt-1 text-xs text-slate-600">No failed recurring payments to review.</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Provider-synced issue tracking will be connected in a later phase.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Pages & content</h4>
            <p className="mt-1 text-xs text-slate-600">
              Contact page is standard and always visible. About and Policy are optional.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={settingsDraft.aboutPageEnabled} onChange={(event) => setSettingsDraft((current) => ({ ...current, aboutPageEnabled: event.target.checked }))} />
                Enable About page
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={settingsDraft.policyPageEnabled} onChange={(event) => setSettingsDraft((current) => ({ ...current, policyPageEnabled: event.target.checked }))} />
                Enable Policy page
              </label>
              <label className="text-xs font-semibold text-slate-700">
                About mode
                <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.aboutPageMode} onChange={(event) => setSettingsDraft((current) => ({ ...current, aboutPageMode: event.target.value as SettingsDraft["aboutPageMode"] }))}>
                  <option value="GENERAL">General page</option>
                  <option value="STAFF_PROFILES">Staff profiles</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">
                About image placement
                <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.aboutImagePlacement} onChange={(event) => setSettingsDraft((current) => ({ ...current, aboutImagePlacement: event.target.value as SettingsDraft["aboutImagePlacement"] }))}>
                  <option value="ABOVE">Images above text</option>
                  <option value="BESIDE">Images beside text</option>
                  <option value="BELOW">Images below text</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">About title
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.aboutTitle} onChange={(event) => setSettingsDraft((current) => ({ ...current, aboutTitle: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">About body
                <textarea className="mt-1 min-h-[96px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.aboutBody} onChange={(event) => setSettingsDraft((current) => ({ ...current, aboutBody: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700">About image one URL
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.aboutImageOneUrl} onChange={(event) => setSettingsDraft((current) => ({ ...current, aboutImageOneUrl: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700">About image two URL
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.aboutImageTwoUrl} onChange={(event) => setSettingsDraft((current) => ({ ...current, aboutImageTwoUrl: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">About staff profiles JSON (optional)
                <textarea className="mt-1 min-h-[110px] w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={settingsDraft.aboutStaffProfilesJson} onChange={(event) => setSettingsDraft((current) => ({ ...current, aboutStaffProfilesJson: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700">Contact page title
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.contactTitle} onChange={(event) => setSettingsDraft((current) => ({ ...current, contactTitle: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700">Map/location note
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.contactMapNote} onChange={(event) => setSettingsDraft((current) => ({ ...current, contactMapNote: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Service area / contact intro text
                <textarea className="mt-1 min-h-[80px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.contactIntro} onChange={(event) => setSettingsDraft((current) => ({ ...current, contactIntro: event.target.value }))} />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={settingsDraft.contactMapEnabled} onChange={(event) => setSettingsDraft((current) => ({ ...current, contactMapEnabled: event.target.checked }))} />
                Show Google Maps link from business address
              </label>
              {policyNeedsReview ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 sm:col-span-2">
                  <p className="font-semibold">A default booking and cancellation policy is currently being used.</p>
                  <p className="mt-1">Please review it and update it if your terms are different.</p>
                  <p className="mt-2 whitespace-pre-wrap">{DEFAULT_BOOKING_POLICY_BODY}</p>
                </div>
              ) : null}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={settingsDraft.policyDefaultAccepted}
                  onChange={(event) => setSettingsDraft((current) => ({ ...current, policyDefaultAccepted: event.target.checked }))}
                />
                I have reviewed and accept the default booking and cancellation policy
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Policy title
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.policyTitle} onChange={(event) => setSettingsDraft((current) => ({ ...current, policyTitle: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Policy intro
                <textarea className="mt-1 min-h-[70px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.policyIntro} onChange={(event) => setSettingsDraft((current) => ({ ...current, policyIntro: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Policy body
                <textarea className="mt-1 min-h-[100px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.policyBody} onChange={(event) => setSettingsDraft((current) => ({ ...current, policyBody: event.target.value }))} />
              </label>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Social media</h4>
            <p className="mt-1 text-xs text-slate-600">Only enabled profiles with valid URLs appear on the public site.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {([
                ["facebook", "Facebook"],
                ["instagram", "Instagram"],
                ["tiktok", "TikTok"],
                ["xTwitter", "X / Twitter"],
                ["linkedin", "LinkedIn"],
                ["youtube", "YouTube"],
              ] as Array<[SettingsSocialKey, string]>).map(([key, label]) => (
                <div key={key} className="rounded-lg border border-slate-200 bg-white p-3">
                  <label className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                    <span>{label}</span>
                    <input type="checkbox" checked={settingsDraft.socialLinks[key].enabled} onChange={(event) => setSettingsDraft((current) => ({ ...current, socialLinks: { ...current.socialLinks, [key]: { ...current.socialLinks[key], enabled: event.target.checked } } }))} />
                  </label>
                  <input className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="https://..." value={settingsDraft.socialLinks[key].url} onChange={(event) => setSettingsDraft((current) => ({ ...current, socialLinks: { ...current.socialLinks, [key]: { ...current.socialLinks[key], url: event.target.value } } }))} />
                </div>
              ))}
            </div>
          </div>

          <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveSettings()}>
            Save site settings
          </button>
        </section>
      ) : null}

      {activeSection === "appearance" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Site appearance</h3>
          <p className="mt-2 text-sm text-slate-600">
            Choose a simple light or dark appearance. The site layout stays professionally controlled so your pages remain clean and consistent.
          </p>
          <div className="mt-3 max-w-sm">
            <label className="text-xs font-semibold text-slate-700">
              Appearance mode
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={settingsDraft.appearanceMode}
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    appearanceMode: event.target.value as SiteAppearanceMode,
                  }))
                }
              >
                <option value="LIGHT">Light</option>
                <option value="DARK">Dark</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Save from this section to apply your selected appearance to the live site.
          </p>
          <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveSettings()}>
            Save site appearance
          </button>
        </section>
      ) : null}

      {activeSection === "services" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Services/prices</h3>
              <p className="mt-1 text-sm text-slate-600">
                Add the services customers should see on your public site. Published services appear immediately in the Services section.
              </p>
            </div>
            <button
              type="button"
              className={`${outlineButtonClass} ${smallButtonClass}`}
              onClick={() => {
                const tempKey = `draft-${Date.now()}`;
                setServicesDraft((current) => [
                  ...current,
                  {
                    tempKey,
                    name: "",
                    categoryId: "",
                    description: "",
                    basePrice: "",
                    durationMinutes: "",
                    bufferAfterMinutes: "",
                    active: true,
                    sortOrder: String(current.length),
                    recurringEnabled: false,
                    recurringIntervals: [],
                    blockBookingEnabled: false,
                    blockBookingSuggestedCounts: "",
                  },
                ]);
                setExpandedServiceKey(tempKey);
              }}
            >
              Add service
            </button>
          </div>
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Service categories</h4>
                  <p className="mt-1 text-xs text-slate-600">
                    Group services for a cleaner public Services section. Services without a category still display safely.
                  </p>
                </div>
                <button
                  type="button"
                  className={`${outlineButtonClass} ${smallButtonClass}`}
                  onClick={() =>
                    setServiceCategoriesDraft((current) => [
                      ...current,
                      { name: "", active: true, sortOrder: String(current.length) },
                    ])
                  }
                >
                  Add category
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {serviceCategoriesDraft.length === 0 ? (
                  <p className="text-xs text-slate-600">No categories yet. Add one if you want to group related services.</p>
                ) : null}
                {serviceCategoriesDraft.map((category, categoryIndex) => (
                  <div key={`${category.id ?? "new"}-${categoryIndex}`} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_110px_140px_auto] sm:items-end">
                    <label className="text-xs font-semibold text-slate-700">
                      Category name
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                        placeholder="Hair services"
                        value={category.name}
                        onChange={(event) =>
                          setServiceCategoriesDraft((current) =>
                            current.map((row, i) => i === categoryIndex ? { ...row, name: event.target.value } : row),
                          )
                        }
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">
                      Order
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                        inputMode="numeric"
                        value={category.sortOrder}
                        onChange={(event) =>
                          setServiceCategoriesDraft((current) =>
                            current.map((row, i) => i === categoryIndex ? { ...row, sortOrder: event.target.value } : row),
                          )
                        }
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={category.active}
                        onChange={(event) =>
                          setServiceCategoriesDraft((current) =>
                            current.map((row, i) => i === categoryIndex ? { ...row, active: event.target.checked } : row),
                          )
                        }
                      />
                      Public visible
                    </label>
                    <button
                      type="button"
                      className="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      onClick={() =>
                        setServiceCategoriesDraft((current) => {
                          const row = current[categoryIndex];
                          if (!row?.id) return current.filter((_, i) => i !== categoryIndex);
                          return current.map((item, i) => i === categoryIndex ? { ...item, active: false } : item);
                        })
                      }
                    >
                      {category.id ? "Hide category" : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {servicesDraft.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Add your first service so customers can see what you offer.</p>
                <p className="mt-1 text-xs text-slate-600">
                  Start with the name, price and duration. Booking actions stay as placeholders until the booking engine milestone.
                </p>
              </div>
            ) : null}
            {servicesDraft.map((service, index) => {
              const serviceKey = serviceDraftKey(service, index);
              const expanded = !service.id || expandedServiceKey === serviceKey;
              const categoryName = service.categoryId
                ? serviceCategoryById.get(service.categoryId)?.name ?? "Uncategorised"
                : "Uncategorised";
              return (
              <div key={serviceKey} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {service.name.trim() || `Service ${index + 1}`}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {categoryName} | {formatAdminServicePrice(service.basePrice)} | {formatAdminDuration(service.durationMinutes)}
                    </p>
                    {!expanded && service.description.trim() ? (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{service.description.trim()}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${service.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                      {service.active ? "Public visible" : "Hidden"}
                    </span>
                    {service.id ? (
                      <button
                        type="button"
                        className={`${outlineButtonClass} ${smallButtonClass}`}
                        onClick={() => setExpandedServiceKey(expanded ? null : serviceKey)}
                      >
                        {expanded ? "Collapse" : "Edit"}
                      </button>
                    ) : null}
                  </div>
                </div>
                {expanded ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_140px_140px_170px]">
                  <label className="text-xs font-semibold text-slate-700 lg:col-span-1">Service name
                    <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.name} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Category
                    <select
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                      value={service.categoryId}
                      onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, categoryId: event.target.value } : row))}
                    >
                      <option value="">Uncategorised</option>
                      {serviceCategoriesDraft
                        .filter((category) => category.active && category.id)
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                    <span className="mt-1 block text-[11px] font-normal text-slate-600">Save new categories before assigning them.</span>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Base price (£)
                    <input className="mt-1 w-full max-w-[140px] rounded-md border border-slate-300 px-2 py-1 text-sm" inputMode="decimal" placeholder="35" value={service.basePrice} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, basePrice: event.target.value } : row))} />
                    <span className="mt-1 block text-[11px] font-normal text-slate-600">Example: £35.</span>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Duration (minutes)
                    <input className="mt-1 w-full max-w-[140px] rounded-md border border-slate-300 px-2 py-1 text-sm" inputMode="numeric" placeholder="45" value={service.durationMinutes} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, durationMinutes: event.target.value } : row))} />
                    <span className="mt-1 block text-[11px] font-normal text-slate-600">Shown as 45 mins or 1 hr.</span>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Buffer after service (minutes)
                    <input className="mt-1 w-full max-w-[160px] rounded-md border border-slate-300 px-2 py-1 text-sm" inputMode="numeric" placeholder="10" value={service.bufferAfterMinutes} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, bufferAfterMinutes: event.target.value } : row))} />
                    <span className="mt-1 block text-[11px] font-normal text-slate-600">Optional gap after bookings.</span>
                  </label>
                  <label className="text-xs font-semibold text-slate-700 sm:col-span-2 lg:col-span-4">Description
                    <textarea className="mt-1 min-h-[70px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.description} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, description: event.target.value } : row))} />
                  </label>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input type="checkbox" checked={service.recurringEnabled} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, recurringEnabled: event.target.checked } : row))} />
                      Allow this service to be sold as recurring
                    </label>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Future booking option - saved here for later booking setup. The site-level recurring setting can still be controlled in Payments and policies.
                    </p>
                  </div>
                  {service.recurringEnabled ? (
                    <div className="sm:col-span-2 lg:col-span-4">
                      <p className="text-xs font-semibold text-slate-700">Recurring interval</p>
                      <div className="mt-1 flex flex-wrap gap-3">
                        {(["WEEKLY", "MONTHLY", "ANNUALLY"] as const).map((interval) => (
                          <label key={interval} className="flex items-center gap-1 text-xs text-slate-700">
                            <input
                              type="radio"
                              name={`recurring-interval-${service.id ?? index}`}
                              checked={service.recurringIntervals.includes(interval)}
                              onChange={(event) =>
                                setServicesDraft((current) =>
                                  current.map((row, i) => {
                                    if (i !== index) return row;
                                    return { ...row, recurringIntervals: event.target.checked ? [interval] : [] };
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
                  <div className="rounded-lg border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input type="checkbox" checked={service.blockBookingEnabled} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, blockBookingEnabled: event.target.checked } : row))} />
                      Allow block bookings for this service
                    </label>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Future booking option - saved here for later booking setup. The site-level block-booking setting can still be controlled in Payments and policies.
                    </p>
                  </div>
                  {service.blockBookingEnabled ? (
                    <label className="text-xs font-semibold text-slate-700 sm:col-span-2 lg:col-span-4">
                      Suggested block counts (comma separated)
                      <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="5, 10, 12" value={service.blockBookingSuggestedCounts} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, blockBookingSuggestedCounts: event.target.value } : row))} />
                    </label>
                  ) : null}
                </div>
                ) : null}
                {expanded ? (
                  <label className="mt-2 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={service.active}
                      onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))}
                    />
                    Active / public visible
                  </label>
                ) : null}
                <button
                  type="button"
                  className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  onClick={() =>
                    setServicesDraft((current) => {
                      const row = current[index];
                      if (!row?.id) return current.filter((_, i) => i !== index);
                      return current.map((item, i) => i === index ? { ...item, active: !item.active } : item);
                    })
                  }
                >
                  {service.id ? (service.active ? "Hide/archive service" : "Restore/show service") : "Remove draft"}
                </button>
              </div>
              );
            })}
          </div>
          <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveServices()}>
            Save services
          </button>
        </section>
      ) : null}

      {activeSection === "staffRoles" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Staff setup</h3>
          <p className="mt-2 text-sm text-slate-600">
            Add team members if customers can choose who they book with, or if you want appointments assigned to your team.
            Staff login/auth comes later.
          </p>
          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Roles / positions</p>
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setRolesDraft((current) => [...current, { label: "", platformRole: "", active: true, sortOrder: String(current.length) }])}>Add role</button>
              </div>
              <div className="mt-2 space-y-2">
                {rolesDraft.map((role, index) => (
                  <div key={`${role.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Role / Position, e.g. Senior Stylist" value={role.label} onChange={(event) => setRolesDraft((current) => current.map((item, i) => i === index ? { ...item, label: event.target.value } : item))} />
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={role.active} onChange={(event) => setRolesDraft((current) => current.map((item, i) => i === index ? { ...item, active: event.target.checked } : item))} />
                        Active
                      </label>
                    </div>
                    <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setRolesDraft((current) => current.filter((_, i) => i !== index))}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Staff members</p>
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setStaffDraft((current) => [...current, { firstName: "", lastName: "", roleId: "", displayName: "", roleLabel: "", email: "", phone: "", bio: "", active: true, customerSelectable: false, isSuperUser: false, availableWeekdays: [], notes: "", sortOrder: String(current.length) }])}>Add staff</button>
              </div>
              <div className="mt-2 space-y-2">
                {staffDraft.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Add staff members if customers can choose who they book with, or if you want appointments assigned to your team.</p>
                    <p className="mt-1 text-xs text-slate-600">You can add rota and availability later. This section only creates the tenant-scoped staff list.</p>
                  </div>
                ) : null}
                {staffDraft.map((staff, index) => (
                  <div key={`${staff.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{buildStaffDisplayName(staff) || `Staff member ${index + 1}`}</p>
                        <p className="text-xs text-slate-600">{staff.roleLabel || rolesDraft.find((role) => role.id === staff.roleId)?.label || "Role not set"}</p>
                      </div>
                      <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={staff.active} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, active: event.target.checked } : item))} />
                        Active / public visible
                      </label>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="First name" value={staff.firstName} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, firstName: event.target.value } : item))} />
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Last name" value={staff.lastName} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, lastName: event.target.value } : item))} />
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Display name (optional)" value={staff.displayName} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, displayName: event.target.value } : item))} />
                      <select className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={staff.roleId} onChange={(event) => {
                        const nextRoleId = event.target.value;
                        const nextRole = rolesDraft.find((role) => role.id === nextRoleId);
                        setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, roleId: nextRoleId, roleLabel: nextRole?.label ?? item.roleLabel } : item));
                      }}>
                        <option value="">Select role / position</option>
                        {rolesDraft.map((role, roleIndex) => (
                          <option key={`${role.id ?? "new"}-${roleIndex}`} value={role.id ?? ""}>{role.label || "Unnamed role"}</option>
                        ))}
                      </select>
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Role / Position if no saved role selected" value={staff.roleLabel} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, roleLabel: event.target.value } : item))} />
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Email" value={staff.email} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, email: event.target.value } : item))} />
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Phone" value={staff.phone} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, phone: event.target.value } : item))} />
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={staff.customerSelectable} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, customerSelectable: event.target.checked } : item))} />
                        Bookable online / customer selectable
                      </label>
                      <textarea className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-2" placeholder="Bio/notes (optional)" value={staff.bio || staff.notes} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, bio: event.target.value, notes: event.target.value } : item))} />
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold text-slate-700">Available weekdays</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {weekdayValues.map((weekday) => {
                            const checked = staff.availableWeekdays.includes(weekday);
                            return (
                              <label key={weekday} className="flex items-center gap-1 text-xs text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) =>
                                    setStaffDraft((current) =>
                                      current.map((item, i) => {
                                        if (i !== index) return item;
                                        const next = new Set(item.availableWeekdays);
                                        if (event.target.checked) next.add(weekday);
                                        else next.delete(weekday);
                                        return { ...item, availableWeekdays: [...next] as WeekdayValue[] };
                                      }),
                                    )
                                  }
                                />
                                {weekdayLabel(weekday)}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      onClick={() =>
                        setStaffDraft((current) => {
                          const row = current[index];
                          if (!row?.id) return current.filter((_, i) => i !== index);
                          return current.map((item, i) => i === index ? { ...item, active: false } : item);
                        })
                      }
                    >
                      {staff.id ? "Hide/archive staff" : "Remove draft"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveStaffAndRoles()}>
            Save staff & roles
          </button>
        </section>
      ) : null}

      {activeSection === "rotaBreaks" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Opening hours / rota</h3>
              <p className="mt-1 text-sm text-slate-600">
                Set the normal days and times your business is open. Staff rota, holidays and appointment availability will build on this later.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Business opening hours</h4>
                <p className="mt-1 text-xs text-slate-600">
                  These are your normal public opening hours and the first availability window for future booking rules.
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                <span className="font-semibold">Summary: </span>
                {formatBusinessOpeningHoursSummary(settingsDraft.openingHours) || "Opening hours not set yet"}
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {BUSINESS_WEEKDAYS.map((weekday) => {
                const day = settingsDraft.openingHours.days.find((item) => item.weekday === weekday) ??
                  defaultBusinessOpeningHours().days.find((item) => item.weekday === weekday)!;
                function updateDay(patch: Partial<{ open: boolean; startTime: string; endTime: string }>) {
                  setSettingsDraft((current) => ({
                    ...current,
                    openingHours: {
                      days: BUSINESS_WEEKDAYS.map((dayKey) => {
                        const currentDay = current.openingHours.days.find((item) => item.weekday === dayKey) ??
                          defaultBusinessOpeningHours().days.find((item) => item.weekday === dayKey)!;
                        return dayKey === weekday ? { ...currentDay, ...patch } : currentDay;
                      }),
                    },
                  }));
                }
                return (
                  <div key={weekday} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[120px_90px_1fr_1fr] sm:items-center">
                    <p className="text-sm font-semibold text-slate-900">{businessWeekdayLabel(weekday as BusinessWeekday)}</p>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={day.open}
                        onChange={(event) => updateDay({ open: event.target.checked })}
                      />
                      Open
                    </label>
                    <label className="text-xs font-semibold text-slate-700">
                      Opens
                      <input
                        type="time"
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                        value={day.startTime}
                        disabled={!day.open}
                        onChange={(event) => updateDay({ startTime: event.target.value })}
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">
                      Closes
                      <input
                        type="time"
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                        value={day.endTime}
                        disabled={!day.open}
                        onChange={(event) => updateDay({ endTime: event.target.value })}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
            <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveOpeningHours()}>
              Save opening hours
            </button>
          </div>

          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Staff weekly rota</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Choose a staff member, then set their normal working pattern. Rota can be saved outside business hours, but booking slots only appear inside business opening hours.
                  </p>
                </div>
                <label className="text-xs font-semibold text-slate-700">
                  Staff member
                  <select
                    className="mt-1 block min-w-48 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-normal text-slate-900"
                    value={selectedSchedulingStaffId}
                    onChange={(event) => setSelectedSchedulingStaffId(event.target.value)}
                  >
                    <option value="">Select staff member</option>
                    {staffDraft.filter((staff) => staff.active && staff.id).map((staff, index) => (
                      <option key={`${staff.id ?? "new"}-${index}`} value={staff.id ?? ""}>
                        {staff.displayName || "Unnamed staff"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {staffDraft.filter((staff) => staff.active && staff.id).length === 0 ? (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Add and save at least one active staff member before setting rota.
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${outlineButtonClass} ${smallButtonClass}`}
                  disabled={!selectedSchedulingStaffId}
                  onClick={() => {
                    if (!selectedSchedulingStaffId) return;
                    setRotaDaysDraft((current) => {
                      let next = current;
                      for (const weekday of ["monday", "tuesday", "wednesday", "thursday", "friday"] as WeekdayValue[]) {
                        const monday = findRotaDay(next, selectedSchedulingStaffId, "monday");
                        const defaults = defaultRotaTimesForWeekday(settingsDraft.openingHours, weekday, monday);
                        const existing = findRotaDay(next, selectedSchedulingStaffId, weekday) ?? {
                          staffMemberId: selectedSchedulingStaffId,
                          weekday,
                          working: false,
                          startTime: "",
                          endTime: "",
                        };
                        next = upsertRotaDayDraft(next, {
                          ...existing,
                          working: true,
                          startTime: existing.startTime || defaults.startTime,
                          endTime: existing.endTime || defaults.endTime,
                        });
                      }
                      return next;
                    });
                    setMessage("Set Monday-Friday as working using Monday times where available, otherwise business opening hours.");
                  }}
                >
                  Set Monday-Friday as working
                </button>
                <button
                  type="button"
                  className={`${outlineButtonClass} ${smallButtonClass}`}
                  disabled={!selectedSchedulingStaffId}
                  onClick={() => {
                    if (!selectedSchedulingStaffId) return;
                    const monday = findRotaDay(rotaDaysDraft, selectedSchedulingStaffId, "monday");
                    if (!monday?.working || !monday.startTime || !monday.endTime) {
                      setMessage("Set Monday working hours first, then copy them to weekdays.");
                      return;
                    }
                    const copyTargets = (["tuesday", "wednesday", "thursday", "friday"] as WeekdayValue[]).filter(
                      (weekday) => findRotaDay(rotaDaysDraft, selectedSchedulingStaffId, weekday)?.working,
                    );
                    setRotaDaysDraft((current) => {
                      let next = current;
                      for (const weekday of ["tuesday", "wednesday", "thursday", "friday"] as WeekdayValue[]) {
                        const existing = findRotaDay(next, selectedSchedulingStaffId, weekday);
                        if (!existing?.working) continue;
                        next = upsertRotaDayDraft(next, {
                          ...existing,
                          startTime: monday.startTime,
                          endTime: monday.endTime,
                        });
                      }
                      return next;
                    });
                    setMessage(
                      copyTargets.length > 0
                        ? `Copied Monday times to ${copyTargets.length} already-working weekday${copyTargets.length === 1 ? "" : "s"}.`
                        : "No working weekdays to copy to.",
                    );
                  }}
                >
                  Copy Monday times to working weekdays
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Copying Monday times only updates Tuesday-Friday rows that are already marked Working. It will not turn non-working days on.
              </p>
              <div className="mt-2 space-y-2">
                {weekdayValues.map((weekday) => {
                  const allowed = selectedStaff ? selectedStaff.availableWeekdays.includes(weekday) : true;
                  const existing = rotaDaysDraft.find((day) => day.staffMemberId === selectedSchedulingStaffId && day.weekday === weekday);
                  const row = existing ?? {
                    staffMemberId: selectedSchedulingStaffId,
                    weekday,
                    working: false,
                    startTime: "",
                    endTime: "",
                  };
                  const monday = findRotaDay(rotaDaysDraft, selectedSchedulingStaffId, "monday");
                  const defaultTimes = defaultRotaTimesForWeekday(settingsDraft.openingHours, weekday, weekday === "monday" ? null : monday);
                  const warning = rotaBusinessHoursWarning(row, settingsDraft.openingHours);
                  return (
                    <div key={weekday} className={`rounded-md border p-2 ${allowed ? "border-slate-200 bg-slate-50" : "border-amber-300 bg-amber-50"}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="w-24 text-xs font-semibold text-slate-800">{weekdayLabel(weekday)}</p>
                        <label className="flex items-center gap-1 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={row.working}
                            disabled={!selectedSchedulingStaffId || !allowed}
                            onChange={(event) => {
                              if (!selectedSchedulingStaffId) return;
                              const working = event.target.checked;
                              const next = {
                                ...row,
                                working,
                                startTime: working ? row.startTime || defaultTimes.startTime : "",
                                endTime: working ? row.endTime || defaultTimes.endTime : "",
                              };
                              setRotaDaysDraft((current) => {
                                return upsertRotaDayDraft(current, next);
                              });
                              if (!working) {
                                setBreakWindowsDraft((current) =>
                                  current.map((breakWindow) =>
                                    breakWindow.staffMemberId === selectedSchedulingStaffId && breakWindow.weekday === weekday
                                      ? { ...breakWindow, active: false }
                                      : breakWindow,
                                  ),
                                );
                              }
                            }}
                          />
                          Working
                        </label>
                        <input
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                          type="time"
                          placeholder="09:00"
                          value={row.working ? row.startTime : ""}
                          disabled={!row.working || !selectedSchedulingStaffId || !allowed}
                          onChange={(event) => {
                            if (!selectedSchedulingStaffId) return;
                            const next = { ...row, startTime: event.target.value };
                            setRotaDaysDraft((current) => {
                              return upsertRotaDayDraft(current, next);
                            });
                          }}
                        />
                        <input
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                          type="time"
                          placeholder="17:00"
                          value={row.working ? row.endTime : ""}
                          disabled={!row.working || !selectedSchedulingStaffId || !allowed}
                          onChange={(event) => {
                            if (!selectedSchedulingStaffId) return;
                            const next = { ...row, endTime: event.target.value };
                            setRotaDaysDraft((current) => {
                              return upsertRotaDayDraft(current, next);
                            });
                          }}
                        />
                      </div>
                      {!allowed ? (
                        <p className="mt-1 text-xs text-amber-800">This staff member is not available on this day.</p>
                      ) : null}
                      {warning ? (
                        <p className="mt-1 text-xs text-amber-800">{warning}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Staffing coverage</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Quick view of active staff scheduled during business opening hours. Targets by day/period are planned next.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    Interim logic
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {weekdayValues.map((weekday) => {
                    const coverage = staffingCoverageForWeekday(weekday, rotaDaysDraft, staffDraft, settingsDraft.openingHours);
                    return (
                      <div key={weekday} className={`rounded-md border px-3 py-2 text-xs ${coverage.className}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{weekdayLabel(weekday).slice(0, 3)}</p>
                          <p className="font-semibold">{coverage.label}</p>
                        </div>
                        <p className="mt-1">
                          {coverage.staffCount} staff working
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Red = open day with no staff, amber = one staff member, green = two or more staff, grey = business closed.
                </p>
              </div>

              <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Break windows</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Optional simple breaks inside a staff working day. Full closure and holiday overrides stay in the next section.
                  </p>
                </div>
                <button
                  type="button"
                  className={`${outlineButtonClass} ${smallButtonClass}`}
                  onClick={() => {
                    if (!selectedSchedulingStaffId) {
                      setMessage("Select a staff member before adding a break window.");
                      return;
                    }
                    setBreakWindowsDraft((current) => [
                      ...current,
                      {
                        staffMemberId: selectedSchedulingStaffId,
                        weekday: "monday",
                        label: "",
                        startTime: "12:00",
                        endTime: "13:00",
                        active: true,
                      },
                    ]);
                  }}
                >
                  Add break
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {breakWindowsDraft.map((window, index) => (
                  <div key={`${window.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.staffMemberId} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, staffMemberId: event.target.value } : row))}>
                        <option value="">Select staff</option>
                        {staffDraft.map((staff, staffIndex) => (
                          <option key={`${staff.id ?? "new"}-${staffIndex}`} value={staff.id ?? ""}>{staff.displayName || "Unnamed staff"}</option>
                        ))}
                      </select>
                      <select className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.weekday} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, weekday: event.target.value as WeekdayValue } : row))}>
                        {weekdayValues.map((weekday) => (
                          <option key={weekday} value={weekday}>{weekdayLabel(weekday)}</option>
                        ))}
                      </select>
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-2" placeholder="Break label" value={window.label} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} />
                      <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="12:00" value={window.startTime} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, startTime: event.target.value } : row))} />
                      <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="13:00" value={window.endTime} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, endTime: event.target.value } : row))} />
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                        <input type="checkbox" checked={window.active} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                        Active
                      </label>
                    </div>
                    <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setBreakWindowsDraft((current) => current.filter((_, i) => i !== index))}>
                      Remove
                    </button>
                  </div>
                ))}
                {breakWindowsDraft.length === 0 ? <p className="text-sm text-slate-600">No break windows yet.</p> : null}
              </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-teal-950">Booking availability preview</h4>
                <p className="mt-1 text-xs text-teal-900">
                  Preview the first calculated booking slots from services, business opening hours, staff rota, breaks, closures, staff leave, and existing active bookings. Booking submission and payment are still future milestones.
                </p>
              </div>
              <button
                type="button"
                className={`${primaryButtonClass} ${smallButtonClass}`}
                onClick={() => void previewAvailability()}
                disabled={availabilityLoading}
              >
                {availabilityLoading ? "Checking..." : "Preview slots"}
              </button>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <label className="text-xs font-semibold text-teal-950">
                Service
                <select
                  className="mt-1 w-full rounded-md border border-teal-200 bg-white px-2 py-1 text-sm text-slate-900"
                  value={availabilityServiceId}
                  onChange={(event) => {
                    setAvailabilityServiceId(event.target.value);
                    setAvailabilityResult(null);
                  }}
                >
                  <option value="">Select service</option>
                  {servicesDraft.filter((service) => service.id && service.active).map((service) => (
                    <option key={service.id} value={service.id}>{service.name || "Unnamed service"}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-teal-950">
                Staff
                <select
                  className="mt-1 w-full rounded-md border border-teal-200 bg-white px-2 py-1 text-sm text-slate-900"
                  value={availabilityStaffId}
                  onChange={(event) => {
                    setAvailabilityStaffId(event.target.value);
                    setAvailabilityResult(null);
                  }}
                >
                  <option value="">Any available staff</option>
                  {staffDraft.filter((staff) => staff.id && staff.active).map((staff) => (
                    <option key={staff.id} value={staff.id}>{staff.displayName || "Unnamed staff"}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-teal-950">
                Date
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-teal-200 bg-white px-2 py-1 text-sm text-slate-900"
                  value={availabilityDate}
                  onChange={(event) => {
                    setAvailabilityDate(event.target.value);
                    setAvailabilityResult(null);
                  }}
                />
              </label>
            </div>
            {availabilityResult ? (
              <div className="mt-3 rounded-lg border border-teal-200 bg-white p-3">
                <p className="text-xs font-semibold text-slate-900">{availabilityResult.message}</p>
                {availabilityResult.slots.length > 0 ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {availabilityResult.slots.slice(0, 32).map((slot) => (
                      <div key={`${slot.staffMemberId}-${slot.startTime}`} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <p className="font-semibold text-slate-900">{slot.startTime}-{slot.endTime}</p>
                        <p>{slot.staffName}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {availabilityResult.debugReasons.length > 0 ? (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-xs font-semibold text-amber-950">Setup / availability reasons</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-amber-900">
                      {availabilityResult.debugReasons.slice(0, 10).map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveScheduling()}>
            Save scheduling
          </button>
        </section>
      ) : null}

      {activeSection === "closuresHolidays" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Closures, holidays and staff leave</h3>
          <p className="mt-1 text-sm text-slate-600">
            Use this to block dates when the whole business is closed, or when individual staff members are unavailable. These will be used by online booking availability once booking goes live.
          </p>
          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Business closures</p>
                  <p className="mt-1 text-xs text-slate-600">Whole-business holidays, training days, bank holidays, or temporary closures.</p>
                </div>
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setBusinessClosuresDraft((current) => [...current, { date: "", endDate: "", label: "", allDay: true, startTime: "", endTime: "", active: true, customerNote: "" }])}>
                  Add closure
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {[["Current/upcoming", closureGroups.currentUpcoming], ["Past/inactive", closureGroups.pastOrInactive]] .map(([groupLabel, group]) => (
                  <div key={groupLabel as string} className="space-y-2">
                    {(group as BusinessClosureDraft[]).length > 0 ? <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{groupLabel as string}</p> : null}
                    {(group as BusinessClosureDraft[]).map((closure) => {
                      const index = businessClosuresDraft.indexOf(closure);
                      return (
                        <div key={`${closure.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">
                              {closure.label.trim() || "New closure"} | {formatDateRange(closure.date, closure.endDate || closure.date)}
                            </p>
                            <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${closure.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                              {closure.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="text-xs font-semibold text-slate-700">Closure name / reason
                              <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Christmas closure" value={closure.label} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} />
                            </label>
                            <label className="text-xs font-semibold text-slate-700">Customer-facing note
                              <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Optional public note" value={closure.customerNote} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, customerNote: event.target.value } : row))} />
                            </label>
                            <label className="text-xs font-semibold text-slate-700">Start date
                              <input type="date" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={closure.date} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, date: event.target.value, endDate: row.endDate || event.target.value } : row))} />
                            </label>
                            <label className="text-xs font-semibold text-slate-700">End date
                              <input type="date" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={closure.endDate} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, endDate: event.target.value } : row))} />
                            </label>
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
                                <label className="text-xs font-semibold text-slate-700">Start time
                                  <input type="time" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={closure.startTime} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, startTime: event.target.value } : row))} />
                                </label>
                                <label className="text-xs font-semibold text-slate-700">End time
                                  <input type="time" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={closure.endTime} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, endTime: event.target.value } : row))} />
                                </label>
                              </>
                            ) : null}
                          </div>
                          <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setBusinessClosuresDraft((current) => current.filter((_, i) => i !== index))}>
                            Remove draft/delete row
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {businessClosuresDraft.length === 0 ? <p className="text-sm text-slate-600">No business closures yet.</p> : null}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Staff leave / unavailable dates</p>
                  <p className="mt-1 text-xs text-slate-600">Individual holidays, sickness, training, or personal appointments.</p>
                </div>
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setStaffHolidaysDraft((current) => [...current, { staffMemberId: selectedSchedulingStaffId || "", date: "", endDate: "", label: "", allDay: true, startTime: "", endTime: "", active: true, notes: "" }])}>
                  Add staff leave
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {[["Current/upcoming", staffLeaveGroups.currentUpcoming], ["Past/inactive", staffLeaveGroups.pastOrInactive]] .map(([groupLabel, group]) => (
                  <div key={groupLabel as string} className="space-y-2">
                    {(group as StaffHolidayDraft[]).length > 0 ? <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{groupLabel as string}</p> : null}
                    {(group as StaffHolidayDraft[]).map((holiday) => {
                      const index = staffHolidaysDraft.indexOf(holiday);
                      const staffName = staffById.get(holiday.staffMemberId)?.displayName || "Staff not selected";
                      return (
                        <div key={`${holiday.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">
                              {holiday.label.trim() || "New staff leave"} | {staffName} | {formatDateRange(holiday.date, holiday.endDate || holiday.date)}
                            </p>
                            <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${holiday.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                              {holiday.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="text-xs font-semibold text-slate-700">Staff member
                              <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={holiday.staffMemberId} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, staffMemberId: event.target.value } : row))}>
                                <option value="">Select staff</option>
                                {staffDraft.filter((staff) => staff.active && staff.id).map((staff, staffIndex) => (
                                  <option key={`${staff.id ?? "new"}-${staffIndex}`} value={staff.id ?? ""}>{staff.displayName || "Unnamed staff"}</option>
                                ))}
                              </select>
                            </label>
                            <label className="text-xs font-semibold text-slate-700">Reason
                              <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Holiday" value={holiday.label} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} />
                            </label>
                            <label className="text-xs font-semibold text-slate-700">Start date
                              <input type="date" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={holiday.date} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, date: event.target.value, endDate: row.endDate || event.target.value } : row))} />
                            </label>
                            <label className="text-xs font-semibold text-slate-700">End date
                              <input type="date" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={holiday.endDate} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, endDate: event.target.value } : row))} />
                            </label>
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
                                <label className="text-xs font-semibold text-slate-700">Start time
                                  <input type="time" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={holiday.startTime} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, startTime: event.target.value } : row))} />
                                </label>
                                <label className="text-xs font-semibold text-slate-700">End time
                                  <input type="time" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={holiday.endTime} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, endTime: event.target.value } : row))} />
                                </label>
                              </>
                            ) : null}
                            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Internal notes
                              <textarea className="mt-1 min-h-[52px] w-full rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Optional internal note" value={holiday.notes} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, notes: event.target.value } : row))} />
                            </label>
                          </div>
                          <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setStaffHolidaysDraft((current) => current.filter((_, i) => i !== index))}>
                            Remove draft/delete row
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {staffHolidaysDraft.length === 0 ? <p className="text-sm text-slate-600">No staff leave yet.</p> : null}
              </div>
            </div>
          </div>

          <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveScheduling()}>
            Save closures & holidays
          </button>
        </section>
      ) : null}

      {activeSection === "bookings" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Bookings</h3>
          <p className="mt-1 text-sm text-slate-600">
              Review confirmed customer bookings, payment status, and basic booking changes.
          </p>
          <div className="mt-3 space-y-2">
            {bookings.length === 0 ? (
              <p className="text-sm text-slate-600">No bookings found yet.</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{booking.customerName}</p>
                      <p>
                        {booking.serviceName ?? "Service not set"} | {formatBookingDateTime(booking)}
                      </p>
                      <p>Staff: {booking.staffName ?? "Unassigned"}</p>
                      <p>Email: {booking.customerEmail ?? "Not provided"}</p>
                      <p>Phone: {booking.customerPhone ?? "Not provided"}</p>
                      {booking.notes ? <p>Notes: {booking.notes}</p> : null}
                      <p>Created: {formatUkDateTime(booking.createdAt)}</p>
                      <p>Policy accepted: {formatUkDateTime(booking.policyAcceptedAt)}</p>
                    </div>
                    <div className="min-w-40 text-right">
                      <span className="inline-flex rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800">
                        {booking.status}
                      </span>
                      <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                        <p className="font-semibold text-slate-900">Payment: {formatBookingPaymentStatus(booking)}</p>
                        <p>Method: {booking.paymentMethod ?? "NONE"}</p>
                        <p>Amount: {formatBookingPaymentAmount(booking)}</p>
                        {booking.paymentProvider ? <p>Provider: {booking.paymentProvider}</p> : null}
                        {booking.paymentProviderSessionId ? <p>Provider session: {booking.paymentProviderSessionId}</p> : null}
                        {booking.paymentProviderPaymentIntentId ? <p>Payment intent: {booking.paymentProviderPaymentIntentId}</p> : null}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">Payment handling is not connected yet.</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" ? (
                      <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => startBookingAmend(booking)}>
                        Amend / reschedule
                      </button>
                    ) : null}
                    {booking.status !== "CONFIRMED" && booking.status !== "CANCELLED" && booking.status !== "COMPLETED" ? (
                      <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void updateBookingStatus(booking.id, "CONFIRMED")}>
                        Mark confirmed
                      </button>
                    ) : null}
                    {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" ? (
                      <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void updateBookingStatus(booking.id, "CANCELLED")}>
                        Cancel booking
                      </button>
                    ) : null}
                    {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" ? (
                      <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void updateBookingStatus(booking.id, "COMPLETED")}>
                        Mark completed
                      </button>
                    ) : null}
                    {(booking.paymentStatus === "PENDING" || booking.paymentStatus === "PAYMENT_REQUIRED") && booking.paymentMethod !== "CARD_ONLINE" && booking.status !== "CANCELLED" ? (
                      <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void updateBookingStatus(booking.id, booking.status, "PAID")}>
                        Mark manual payment received
                      </button>
                    ) : null}
                  </div>
                  {editingBookingId === booking.id && bookingAmendDraft ? (
                    <div className="mt-3 rounded-lg border border-teal-200 bg-white p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Amend / reschedule booking</p>
                          <p className="mt-1 text-xs text-slate-600">
                            Update customer details or choose a calculated available slot. The current booking is ignored as a self-conflict.
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`${outlineButtonClass} ${smallButtonClass}`}
                          onClick={() => {
                            setEditingBookingId(null);
                            setBookingAmendDraft(null);
                            setBookingAmendAvailability(null);
                          }}
                        >
                          Close
                        </button>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Customer name
                          <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={bookingAmendDraft.customerName} onChange={(event) => setBookingAmendDraft((current) => current ? { ...current, customerName: event.target.value } : current)} />
                        </label>
                        <label className="text-xs font-semibold text-slate-700">
                          Customer email
                          <input type="email" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={bookingAmendDraft.customerEmail} onChange={(event) => setBookingAmendDraft((current) => current ? { ...current, customerEmail: event.target.value } : current)} />
                        </label>
                        <label className="text-xs font-semibold text-slate-700">
                          Customer phone
                          <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={bookingAmendDraft.customerPhone} onChange={(event) => setBookingAmendDraft((current) => current ? { ...current, customerPhone: event.target.value } : current)} />
                        </label>
                        <label className="text-xs font-semibold text-slate-700">
                          Status
                          <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={bookingAmendDraft.status} onChange={(event) => setBookingAmendDraft((current) => current ? { ...current, status: event.target.value as CustomerSiteBookingRecord["status"] } : current)}>
                            {(["REQUESTED", "SUBMITTED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"] as CustomerSiteBookingRecord["status"][]).map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-semibold text-slate-700">
                          Service
                          <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={bookingAmendDraft.serviceId} onChange={(event) => setBookingAmendDraft((current) => current ? { ...current, serviceId: event.target.value, selectedSlot: null } : current)}>
                            <option value="">Select service</option>
                            {servicesDraft.filter((service) => service.id && service.active).map((service) => (
                              <option key={service.id} value={service.id}>{service.name || "Unnamed service"}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-semibold text-slate-700">
                          Staff
                          <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={bookingAmendDraft.staffMemberId} onChange={(event) => setBookingAmendDraft((current) => current ? { ...current, staffMemberId: event.target.value, selectedSlot: null } : current)}>
                            <option value="">Any available staff</option>
                            {staffDraft.filter((staff) => staff.id && staff.active).map((staff) => (
                              <option key={staff.id} value={staff.id}>{staff.displayName || "Unnamed staff"}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-semibold text-slate-700">
                          Date
                          <input type="date" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={bookingAmendDraft.preferredDate} onChange={(event) => setBookingAmendDraft((current) => current ? { ...current, preferredDate: event.target.value, selectedSlot: null } : current)} />
                        </label>
                        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                          Notes
                          <textarea className="mt-1 min-h-16 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={bookingAmendDraft.notes} onChange={(event) => setBookingAmendDraft((current) => current ? { ...current, notes: event.target.value } : current)} />
                        </label>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void checkBookingAmendAvailability()} disabled={bookingAmendLoading}>
                          {bookingAmendLoading ? "Checking..." : "Check reschedule times"}
                        </button>
                        <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveBookingAmend(booking)}>
                          Save booking changes
                        </button>
                      </div>
                      {bookingAmendDraft.selectedSlot ? (
                        <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
                          Selected: {bookingAmendDraft.selectedSlot.startTime}-{bookingAmendDraft.selectedSlot.endTime} {bookingAmendDraft.staffMemberId ? `with ${bookingAmendDraft.selectedSlot.staffName}` : "(staff assigned automatically)"}
                        </p>
                      ) : null}
                      {bookingAmendAvailability ? (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-slate-800">Available reschedule times</p>
                          {bookingAmendAvailability.slots.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {bookingAmendAvailability.slots.slice(0, 48).map((slot) => {
                                const selected =
                                  bookingAmendDraft.selectedSlot?.date === slot.date &&
                                  bookingAmendDraft.selectedSlot?.startTime === slot.startTime &&
                                  bookingAmendDraft.selectedSlot?.staffMemberId === slot.staffMemberId;
                                return (
                                  <button
                                    key={`${slot.staffMemberId}-${slot.startTime}`}
                                    type="button"
                                    aria-pressed={selected}
                                    className={selected ? "rounded-full border border-emerald-500 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-950" : "rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-teal-50"}
                                    onClick={() => setBookingAmendDraft((current) => current ? {
                                      ...current,
                                      selectedSlot: {
                                        date: slot.date,
                                        startTime: slot.startTime,
                                        endTime: slot.endTime,
                                        staffMemberId: slot.staffMemberId,
                                        staffName: slot.staffName,
                                      },
                                    } : current)}
                                  >
                                    {slot.startTime}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-slate-600">No available slots found for that service/staff/date.</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}

