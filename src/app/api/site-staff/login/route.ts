import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  createSiteStaffSessionToken,
  setSiteStaffSessionCookie,
} from "@/lib/auth/site-staff-session";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { authenticateCustomerSiteStaffMember } from "@/lib/sites/customer-site-staff-repository";

const staffLoginSchema = z.object({
  siteSlug: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  accessCode: z.string().trim().min(4).max(80),
  callbackUrl: z.string().trim().max(500).optional(),
});

function safeCallbackUrl(callbackUrl: string | undefined, siteSlug: string): string {
  if (!callbackUrl) return `/site-staff/${encodeURIComponent(siteSlug)}`;
  if (!callbackUrl.startsWith("/site-staff/")) return `/site-staff/${encodeURIComponent(siteSlug)}`;
  return callbackUrl;
}

export async function POST(request: NextRequest) {
  if (!isBackendPersistenceConfigured()) {
    return NextResponse.json(
      { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const parsed = staffLoginSchema.parse(body);
    const auth = await authenticateCustomerSiteStaffMember({
      siteSlug: parsed.siteSlug,
      email: parsed.email,
      accessCode: parsed.accessCode,
    });
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "INVALID_STAFF_ACCESS" },
        { status: 401 },
      );
    }

    const token = createSiteStaffSessionToken({
      tenantSiteId: auth.tenantSiteId,
      tenantSlug: auth.tenantSlug,
      staffMemberId: auth.staffMemberId,
      staffDisplayName: auth.staffDisplayName,
      email: auth.email,
    });
    const redirectUrl = safeCallbackUrl(parsed.callbackUrl, auth.tenantSlug);
    const response = NextResponse.json({ ok: true, redirectUrl });
    setSiteStaffSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_STAFF_LOGIN_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
