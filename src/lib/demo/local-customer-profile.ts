export type LocalCustomerProfile = {
  name: string;
  email: string;
  phone: string;
  updatedAtIso: string;
};

const PROFILE_KEY = "subs-demo-customer-profile";

function fallbackProfile(): LocalCustomerProfile {
  return {
    name: "",
    email: "",
    phone: "",
    updatedAtIso: new Date(0).toISOString(),
  };
}

export function getLocalCustomerProfile(): LocalCustomerProfile {
  if (typeof window === "undefined") return fallbackProfile();
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return fallbackProfile();
  try {
    const parsed = JSON.parse(raw) as Partial<LocalCustomerProfile>;
    return {
      name: parsed.name ?? "",
      email: parsed.email ?? "",
      phone: parsed.phone ?? "",
      updatedAtIso: parsed.updatedAtIso ?? new Date(0).toISOString(),
    };
  } catch {
    return fallbackProfile();
  }
}

export function saveLocalCustomerProfile(
  profile: Omit<LocalCustomerProfile, "updatedAtIso">,
): LocalCustomerProfile {
  const next: LocalCustomerProfile = {
    ...profile,
    updatedAtIso: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  }
  return next;
}
