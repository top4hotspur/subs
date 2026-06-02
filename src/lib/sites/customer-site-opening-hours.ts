export const BUSINESS_WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type BusinessWeekday = (typeof BUSINESS_WEEKDAYS)[number];

export type BusinessOpeningHoursDay = {
  weekday: BusinessWeekday;
  open: boolean;
  startTime: string;
  endTime: string;
};

export type BusinessOpeningHours = {
  days: BusinessOpeningHoursDay[];
};

const WEEKDAY_LABELS: Record<BusinessWeekday, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function defaultBusinessOpeningHours(): BusinessOpeningHours {
  return {
    days: BUSINESS_WEEKDAYS.map((weekday) => ({
      weekday,
      open: false,
      startTime: "",
      endTime: "",
    })),
  };
}

export function timeToMinutes(value: string): number | null {
  if (!TIME_PATTERN.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function normalizeBusinessOpeningHours(value: unknown): BusinessOpeningHours {
  const fallback = defaultBusinessOpeningHours();
  if (!value || typeof value !== "object" || !("days" in value) || !Array.isArray(value.days)) {
    return fallback;
  }
  const rawDays = value.days as unknown[];

  return {
    days: BUSINESS_WEEKDAYS.map((weekday) => {
      const rawDay = rawDays.find((item) => item && typeof item === "object" && "weekday" in item && item.weekday === weekday);
      if (!rawDay || typeof rawDay !== "object") {
        return fallback.days.find((day) => day.weekday === weekday)!;
      }
      const startTime = "startTime" in rawDay && typeof rawDay.startTime === "string" ? rawDay.startTime : "";
      const endTime = "endTime" in rawDay && typeof rawDay.endTime === "string" ? rawDay.endTime : "";
      return {
        weekday,
        open: "open" in rawDay ? Boolean(rawDay.open) : false,
        startTime,
        endTime,
      };
    }),
  };
}

export function validateBusinessOpeningHours(hours: BusinessOpeningHours): string[] {
  const errors: string[] = [];
  for (const day of hours.days) {
    if (!day.open) continue;
    const label = WEEKDAY_LABELS[day.weekday];
    if (!day.startTime || !day.endTime) {
      errors.push(`${label}: open days need both opening and closing times.`);
      continue;
    }
    const start = timeToMinutes(day.startTime);
    const end = timeToMinutes(day.endTime);
    if (start === null || end === null) {
      errors.push(`${label}: use 24-hour HH:mm times, for example 09:00.`);
      continue;
    }
    if (end <= start) {
      errors.push(`${label}: closing time must be after opening time.`);
    }
  }
  return errors;
}

export function hasValidOpenBusinessDay(hours: BusinessOpeningHours): boolean {
  return hours.days.some((day) => {
    if (!day.open) return false;
    const start = timeToMinutes(day.startTime);
    const end = timeToMinutes(day.endTime);
    return start !== null && end !== null && end > start;
  });
}

export function formatBusinessOpeningHoursSummary(hours: BusinessOpeningHours): string {
  const validDays = hours.days.filter((day) => {
    if (!day.open) return false;
    const start = timeToMinutes(day.startTime);
    const end = timeToMinutes(day.endTime);
    return start !== null && end !== null && end > start;
  });
  if (validDays.length === 0) return "";

  const groups: Array<{ startIndex: number; endIndex: number; startTime: string; endTime: string }> = [];
  for (const day of validDays) {
    const index = BUSINESS_WEEKDAYS.indexOf(day.weekday);
    const last = groups[groups.length - 1];
    if (last && last.endIndex + 1 === index && last.startTime === day.startTime && last.endTime === day.endTime) {
      last.endIndex = index;
    } else {
      groups.push({ startIndex: index, endIndex: index, startTime: day.startTime, endTime: day.endTime });
    }
  }

  return groups
    .map((group) => {
      const startLabel = WEEKDAY_LABELS[BUSINESS_WEEKDAYS[group.startIndex]];
      const endLabel = WEEKDAY_LABELS[BUSINESS_WEEKDAYS[group.endIndex]];
      const label = group.startIndex === group.endIndex ? startLabel : `${startLabel}-${endLabel}`;
      return `${label}: ${group.startTime}-${group.endTime}`;
    })
    .join("; ");
}

export function weekdayLabel(weekday: BusinessWeekday): string {
  return WEEKDAY_LABELS[weekday];
}
