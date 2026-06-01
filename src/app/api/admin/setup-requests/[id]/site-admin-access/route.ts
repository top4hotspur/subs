import { NextRequest, NextResponse } from "next/server";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { generateTemporaryAccessCode } from "@/lib/auth/access-code";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/prisma";
import {
  createCustomerSiteAdminUser,
  updateCustomerSiteAdminUser,
} from "@/lib/sites/customer-site-admin-user-repository";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

function toAccessResponse(input: {
  setupRequestId: string;
  tenantSiteId: string;
  siteSlug: string;
  adminEmail: string | null;
  siteAdminUserId: string | null;
  accessCodeExists: boolean;
  invitationStatus: "INVITED" | "ACTIVE" | "DISABLED" | null;
  active: boolean | null;
}) {
  return input;
}

async function resolveSetupRequestAndSite(id: string) {
  const setupRequest = await prisma.setupRequest.findUnique({
    where: { id },
    select: {
      id: true,
      contactEmail: true,
      tenantSiteId: true,
      tenantSite: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  if (!setupRequest) {
    return { error: "SETUP_REQUEST_NOT_FOUND" as const };
  }
  if (!setupRequest.tenantSite || !setupRequest.tenantSiteId) {
    return { error: "SUBSCRIBER_SITE_NOT_PROVISIONED" as const };
  }

  return {
    setupRequest: {
      id: setupRequest.id,
      contactEmail: setupRequest.contactEmail,
      tenantSiteId: setupRequest.tenantSiteId,
      tenantSite: setupRequest.tenantSite,
    },
  };
}

async function loadPreferredAdminUser(tenantSiteId: string, preferredEmail: string | null) {
  if (preferredEmail) {
    const byEmail = await prisma.customerSiteAdminUser.findFirst({
      where: {
        tenantSiteId,
        email: preferredEmail,
      },
      orderBy: { createdAt: "asc" },
    });
    if (byEmail) return byEmail;
  }

  return prisma.customerSiteAdminUser.findFirst({
    where: {
      tenantSiteId,
      role: { in: ["OWNER", "ADMIN"] },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const resolved = await resolveSetupRequestAndSite(id);
    if ("error" in resolved) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: 404 });
    }

    const preferredEmail = resolved.setupRequest.contactEmail?.trim().toLowerCase() ?? null;
    const user = await loadPreferredAdminUser(resolved.setupRequest.tenantSiteId, preferredEmail);

    return NextResponse.json({
      ok: true,
      access: toAccessResponse({
        setupRequestId: resolved.setupRequest.id,
        tenantSiteId: resolved.setupRequest.tenantSiteId,
        siteSlug: resolved.setupRequest.tenantSite.slug,
        adminEmail: user?.email ?? preferredEmail,
        siteAdminUserId: user?.id ?? null,
        accessCodeExists: Boolean(user?.accessCodeHash),
        invitationStatus: (user?.invitationStatus as "INVITED" | "ACTIVE" | "DISABLED" | undefined) ?? null,
        active: user?.active ?? null,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SETUP_REQUEST_SITE_ADMIN_ACCESS_GET_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const resolved = await resolveSetupRequestAndSite(id);
    if ("error" in resolved) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as { email?: unknown };
    const bodyEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const fallbackEmail = resolved.setupRequest.contactEmail?.trim().toLowerCase() ?? "";
    const targetEmail = bodyEmail || fallbackEmail;

    if (!targetEmail) {
      return NextResponse.json({ ok: false, error: "SITE_ADMIN_EMAIL_REQUIRED" }, { status: 400 });
    }

    const existing = await loadPreferredAdminUser(resolved.setupRequest.tenantSiteId, targetEmail);
    const generatedAccessCode = generateTemporaryAccessCode(10);

    if (existing) {
      const nextInvitationStatus: "INVITED" | "ACTIVE" | "DISABLED" =
        existing.invitationStatus === "DISABLED"
          ? "INVITED"
          : existing.invitationStatus === "ACTIVE"
            ? "ACTIVE"
            : "INVITED";
      await updateCustomerSiteAdminUser({
        tenantSiteId: resolved.setupRequest.tenantSiteId,
        id: existing.id,
        accessCode: generatedAccessCode,
        active: true,
        invitationStatus: nextInvitationStatus,
      });
    } else {
      await createCustomerSiteAdminUser({
        tenantSiteId: resolved.setupRequest.tenantSiteId,
        email: targetEmail,
        displayName: resolved.setupRequest.contactEmail ? null : null,
        role: "OWNER",
        active: true,
        invitationStatus: "INVITED",
        accessCode: generatedAccessCode,
      });
    }

    const refreshedUser = await loadPreferredAdminUser(resolved.setupRequest.tenantSiteId, targetEmail);

    return NextResponse.json({
      ok: true,
      access: toAccessResponse({
        setupRequestId: resolved.setupRequest.id,
        tenantSiteId: resolved.setupRequest.tenantSiteId,
        siteSlug: resolved.setupRequest.tenantSite.slug,
        adminEmail: refreshedUser?.email ?? targetEmail,
        siteAdminUserId: refreshedUser?.id ?? null,
        accessCodeExists: Boolean(refreshedUser?.accessCodeHash),
        invitationStatus:
          (refreshedUser?.invitationStatus as "INVITED" | "ACTIVE" | "DISABLED" | undefined) ?? null,
        active: refreshedUser?.active ?? null,
      }),
      generatedAccessCode,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SETUP_REQUEST_SITE_ADMIN_ACCESS_RESET_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
