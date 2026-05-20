import { CustomerRequest } from "@/lib/requests/request-types";
import { LocalSetupRequest } from "@/lib/sites/types";

export function escapeCsvValue(value: unknown): string {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

export function rowsToCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const body = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  return `${headerLine}\n${body}`;
}

export function customerRequestsToCsv(requests: CustomerRequest[]): string {
  const headers = [
    "created_date",
    "industry",
    "customer_name",
    "email",
    "phone",
    "service",
    "status",
    "pricing_status",
    "preferred_date",
    "preferred_time",
    "assigned_staff",
    "quoted_price",
    "final_price",
    "notes",
  ];

  const rows = requests.map((request) => [
    request.createdAtIso,
    request.templateSlug,
    request.customerName,
    request.customerEmail,
    request.customerPhone,
    request.serviceName ?? request.serviceId ?? "",
    request.status,
    request.pricingStatus,
    request.preferredDate ?? "",
    request.preferredTime ?? "",
    request.assignedStaffName ?? "",
    request.quotedPriceGbp ?? "",
    request.finalPriceGbp ?? "",
    request.notes ?? "",
  ]);

  return rowsToCsv(headers, rows);
}

export function setupRequestsToCsv(requests: LocalSetupRequest[]): string {
  const headers = [
    "created_date",
    "industry",
    "business_name",
    "domain_option",
    "existing_domain",
    "desired_or_suggestions",
    "communication_option",
    "setup_total",
    "monthly_total",
    "status",
    "contact_name",
    "contact_email",
    "contact_phone",
    "notes",
  ];

  const rows = requests.map((request) => [
    request.createdAtIso,
    request.templateSlug,
    request.businessName,
    request.domainOption,
    request.existingDomain ?? "",
    request.desiredDomain ?? "",
    request.communicationOption,
    request.setupTotalGbp,
    request.monthlyTotalGbp,
    request.status,
    request.contactName ?? "",
    request.contactEmail ?? "",
    request.contactPhone ?? "",
    request.notes ?? "",
  ]);

  return rowsToCsv(headers, rows);
}

export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
