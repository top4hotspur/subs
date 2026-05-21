import { CustomerRequest } from "@/lib/requests/request-types";
import { CustomerBookingHistoryItem, CustomerRecord } from "@/lib/crm/customer-types";

export const LOCAL_CRM_CUSTOMERS_KEY = "subs-crm-customers";

type CustomerPatch = Partial<Pick<CustomerRecord, "name" | "email" | "phone" | "notes" | "tags">>;

function parse(raw: string | null): CustomerRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CustomerRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(customers: CustomerRecord[]): CustomerRecord[] {
  if (typeof window === "undefined") return customers;
  window.localStorage.setItem(LOCAL_CRM_CUSTOMERS_KEY, JSON.stringify(customers));
  return customers;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `crm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function customerMatchesRequest(customer: CustomerRecord, request: CustomerRequest): boolean {
  const email = normalize(request.customerEmail);
  const phone = normalize(request.customerPhone);
  const name = normalize(request.customerName);

  if (email && normalize(customer.email) === email) return true;
  if (phone && normalize(customer.phone) === phone) return true;
  if (name && normalize(customer.name) === name) return true;
  return false;
}

export function listLocalCustomers(): CustomerRecord[] {
  if (typeof window === "undefined") return [];
  return parse(window.localStorage.getItem(LOCAL_CRM_CUSTOMERS_KEY)).sort(
    (a, b) => new Date(b.updatedAtIso).getTime() - new Date(a.updatedAtIso).getTime(),
  );
}

export function buildCustomersFromLocalRequests(requests: CustomerRequest[]): CustomerRecord[] {
  const existing = listLocalCustomers();
  const byId = new Map(existing.map((c) => [c.id, c]));

  requests.forEach((request) => {
    const match = Array.from(byId.values()).find((customer) => customerMatchesRequest(customer, request));
    const now = new Date().toISOString();

    if (match) {
      const completed = request.status === "COMPLETED" ? 1 : 0;
      byId.set(match.id, {
        ...match,
        name: request.customerName || match.name,
        email: request.customerEmail || match.email,
        phone: request.customerPhone || match.phone,
        totalBookings: match.totalBookings + 1,
        totalCompletedBookings: match.totalCompletedBookings + completed,
        lastBookingAtIso: request.createdAtIso,
        updatedAtIso: now,
      });
      return;
    }

    byId.set(generateId(), {
      id: generateId(),
      name: request.customerName,
      email: request.customerEmail,
      phone: request.customerPhone,
      notes: "",
      tags: [],
      createdAtIso: now,
      updatedAtIso: now,
      lastBookingAtIso: request.createdAtIso,
      totalBookings: 1,
      totalCompletedBookings: request.status === "COMPLETED" ? 1 : 0,
    });
  });

  const built = Array.from(byId.values());
  return write(built);
}

export function upsertCustomerFromRequest(request: CustomerRequest): CustomerRecord {
  const customers = listLocalCustomers();
  const existing = customers.find((customer) => customerMatchesRequest(customer, request));
  const now = new Date().toISOString();

  if (existing) {
    const updated: CustomerRecord = {
      ...existing,
      name: request.customerName || existing.name,
      email: request.customerEmail || existing.email,
      phone: request.customerPhone || existing.phone,
      totalBookings: existing.totalBookings + 1,
      totalCompletedBookings:
        existing.totalCompletedBookings + (request.status === "COMPLETED" ? 1 : 0),
      lastBookingAtIso: request.createdAtIso,
      updatedAtIso: now,
    };
    write(customers.map((customer) => (customer.id === existing.id ? updated : customer)));
    return updated;
  }

  const created: CustomerRecord = {
    id: generateId(),
    name: request.customerName,
    email: request.customerEmail,
    phone: request.customerPhone,
    notes: "",
    tags: [],
    createdAtIso: now,
    updatedAtIso: now,
    lastBookingAtIso: request.createdAtIso,
    totalBookings: 1,
    totalCompletedBookings: request.status === "COMPLETED" ? 1 : 0,
  };

  write([created, ...customers]);
  return created;
}

export function getCustomerBookingHistory(customerId: string, requests: CustomerRequest[]): CustomerBookingHistoryItem[] {
  const customer = listLocalCustomers().find((item) => item.id === customerId);
  if (!customer) return [];

  return requests
    .filter((request) => customerMatchesRequest(customer, request))
    .map((request) => ({
      requestId: request.id,
      industrySlug: request.templateSlug,
      serviceName: request.serviceName,
      status: request.status,
      preferredDate: request.preferredDate,
      preferredTime: request.preferredTime,
      finalPriceGbp: request.finalPriceGbp,
      createdAtIso: request.createdAtIso,
    }))
    .sort((a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime());
}

export function updateLocalCustomer(customerId: string, patch: CustomerPatch): CustomerRecord | null {
  const customers = listLocalCustomers();
  const target = customers.find((customer) => customer.id === customerId);
  if (!target) return null;

  const updated: CustomerRecord = {
    ...target,
    ...patch,
    updatedAtIso: new Date().toISOString(),
  };

  write(customers.map((customer) => (customer.id === customerId ? updated : customer)));
  return updated;
}

export function clearLocalCustomers(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_CRM_CUSTOMERS_KEY);
}
