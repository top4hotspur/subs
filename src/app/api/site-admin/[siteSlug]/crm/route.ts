import { NextResponse } from "next/server";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/prisma";
import { createBookingAccessPath } from "@/lib/sites/booking-access-token";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

async function resolveAuthorizedTenant(siteSlug: string) {
  const session = await getSiteAdminSessionContext();
  if (!session) return { error: "FORBIDDEN", status: 403 as const };
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) return { error: "SITE_NOT_FOUND", status: 404 as const };
  if (session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    return { error: "FORBIDDEN", status: 403 as const };
  }
  return { tenantSiteId: site.id, siteSlug: site.slug };
}

function bookingDateValue(booking: { preferredDate: string | null; startDateTime: Date | null; createdAt: Date }): number {
  if (booking.startDateTime) return booking.startDateTime.getTime();
  if (booking.preferredDate) return new Date(`${booking.preferredDate}T00:00:00.000Z`).getTime();
  return booking.createdAt.getTime();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }
    const [customers, bookings, enquiries] = await Promise.all([
      prisma.customerSiteCustomer.findMany({
        where: { tenantSiteId: resolved.tenantSiteId, active: true },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.customerSiteBooking.findMany({
        where: { tenantSiteId: resolved.tenantSiteId },
        orderBy: [{ preferredDate: "desc" }, { preferredTime: "desc" }, { createdAt: "desc" }],
        take: 500,
      }),
      prisma.customerSiteContactEnquiry.findMany({
        where: { tenantSiteId: resolved.tenantSiteId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const rows = new Map<string, {
      id: string | null;
      name: string;
      email: string;
      phone: string | null;
      marketingOptIn: boolean;
      marketingOptInAt: string | null;
      accountCreated: boolean;
      totalBookings: number;
      completedBookings: number;
      lastBookingDate: string | null;
      nextBookingDate: string | null;
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
    }>();

    for (const customer of customers) {
      const email = customer.email.toLowerCase();
      rows.set(email, {
        id: customer.id,
        name: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
        email,
        phone: customer.phone,
        marketingOptIn: customer.marketingOptIn,
        marketingOptInAt: customer.marketingOptInAt?.toISOString() ?? null,
        accountCreated: true,
        totalBookings: 0,
        completedBookings: 0,
        lastBookingDate: null,
        nextBookingDate: null,
        bookings: [],
      });
    }

    const now = Date.now();
    for (const booking of bookings) {
      const email = booking.customerEmail?.trim().toLowerCase();
      if (!email) continue;
      const existing = rows.get(email) ?? {
        id: null,
        name: booking.customerName,
        email,
        phone: booking.customerPhone,
        marketingOptIn: false,
        marketingOptInAt: null,
        accountCreated: false,
        totalBookings: 0,
        completedBookings: 0,
        lastBookingDate: null,
        nextBookingDate: null,
        bookings: [],
      };
      existing.totalBookings += 1;
      if (booking.status === "COMPLETED") existing.completedBookings += 1;
      if (!existing.phone && booking.customerPhone) existing.phone = booking.customerPhone;
      const timestamp = bookingDateValue(booking);
      if (timestamp < now && (!existing.lastBookingDate || timestamp > new Date(existing.lastBookingDate).getTime())) {
        existing.lastBookingDate = new Date(timestamp).toISOString();
      }
      if (timestamp >= now && (!existing.nextBookingDate || timestamp < new Date(existing.nextBookingDate).getTime())) {
        existing.nextBookingDate = new Date(timestamp).toISOString();
      }
      existing.bookings.push({
        id: booking.id,
        serviceName: booking.serviceName,
        staffName: booking.staffName,
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        detailHref: createBookingAccessPath({
          siteSlug: resolved.siteSlug,
          tenantSiteId: resolved.tenantSiteId,
          bookingId: booking.id,
        }),
      });
      rows.set(email, existing);
    }

    return NextResponse.json({
      ok: true,
      customers: Array.from(rows.values()).sort((a, b) => a.email.localeCompare(b.email)),
      enquiries: enquiries.map((enquiry) => ({
        id: enquiry.id,
        purpose: enquiry.purpose,
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        message: enquiry.message,
        status: enquiry.status,
        bookingId: enquiry.bookingId,
        emailStatus: enquiry.emailStatus,
        createdAt: enquiry.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "SITE_ADMIN_CRM_GET_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
