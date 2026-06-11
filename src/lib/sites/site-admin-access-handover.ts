import { generateTemporaryAccessCode } from "@/lib/auth/access-code";
import { getOptionalServerEnv } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/prisma";
import { sendTransactionalEmail } from "@/lib/email/email-provider";
import { businessAdminAccessHandoverEmail } from "@/lib/email/email-templates";
import {
  createCustomerSiteAdminUser,
  updateCustomerSiteAdminUser,
} from "@/lib/sites/customer-site-admin-user-repository";

export type SetupRequestSiteAdminAccessResponse = {
  setupRequestId: string;
  tenantSiteId: string;
  siteSlug: string;
  adminEmail: string | null;
  siteAdminUserId: string | null;
  accessCodeExists: boolean;
  invitationStatus: "INVITED" | "ACTIVE" | "DISABLED" | null;
  active: boolean | null;
};

export type SetupRequestSiteAdminAccessEmailResult = {
  access: SetupRequestSiteAdminAccessResponse;
  generatedAccessCode: string | null;
  emailSent: boolean;
  emailSkipped: boolean;
  emailStatus: string;
};

type SetupRequestSiteAdminContext =
  | {
      setupRequest: {
        id: string;
        contactName: string | null;
        contactEmail: string | null;
        tenantSiteId: string;
        tenantSite: {
          id: string;
          slug: string;
        };
        businessName: string;
      };
    }
  | { error: "SETUP_REQUEST_NOT_FOUND" | "SUBSCRIBER_SITE_NOT_PROVISIONED" };

function toAccessResponse(input: {
  setupRequestId: string;
  tenantSiteId: string;
  siteSlug: string;
  adminEmail: string | null;
  siteAdminUserId: string | null;
  accessCodeExists: boolean;
  invitationStatus: "INVITED" | "ACTIVE" | "DISABLED" | null;
  active: boolean | null;
}): SetupRequestSiteAdminAccessResponse {
  return input;
}

function absoluteSiteUrl(path: string): string {
  const siteUrlBase = getOptionalServerEnv("NEXT_PUBLIC_SITE_URL")?.replace(/\/+$/, "");
  return siteUrlBase ? `${siteUrlBase}${path}` : path;
}

async function resolveSetupRequestAndSite(id: string): Promise<SetupRequestSiteAdminContext> {
  const setupRequest = await prisma.setupRequest.findUnique({
    where: { id },
    select: {
      id: true,
      businessName: true,
      contactName: true,
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

  const settings = await prisma.customerSiteSettings.findUnique({
    where: { tenantSiteId: setupRequest.tenantSiteId },
    select: { businessName: true, siteDisplayName: true },
  });

  return {
    setupRequest: {
      id: setupRequest.id,
      contactName: setupRequest.contactName,
      contactEmail: setupRequest.contactEmail,
      tenantSiteId: setupRequest.tenantSiteId,
      tenantSite: setupRequest.tenantSite,
      businessName:
        settings?.businessName ||
        settings?.siteDisplayName ||
        setupRequest.businessName ||
        setupRequest.tenantSite.slug,
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

export async function getSetupRequestSiteAdminAccess(
  setupRequestId: string,
): Promise<SetupRequestSiteAdminAccessResponse | { error: "SETUP_REQUEST_NOT_FOUND" | "SUBSCRIBER_SITE_NOT_PROVISIONED" }> {
  const resolved = await resolveSetupRequestAndSite(setupRequestId);
  if ("error" in resolved) return { error: resolved.error };

  const preferredEmail = resolved.setupRequest.contactEmail?.trim().toLowerCase() ?? null;
  const user = await loadPreferredAdminUser(resolved.setupRequest.tenantSiteId, preferredEmail);

  return toAccessResponse({
    setupRequestId: resolved.setupRequest.id,
    tenantSiteId: resolved.setupRequest.tenantSiteId,
    siteSlug: resolved.setupRequest.tenantSite.slug,
    adminEmail: user?.email ?? preferredEmail,
    siteAdminUserId: user?.id ?? null,
    accessCodeExists: Boolean(user?.accessCodeHash),
    invitationStatus:
      (user?.invitationStatus as "INVITED" | "ACTIVE" | "DISABLED" | undefined) ?? null,
    active: user?.active ?? null,
  });
}

export async function resetAndEmailSetupRequestSiteAdminAccess(input: {
  setupRequestId: string;
  email?: string | null;
}): Promise<
  | SetupRequestSiteAdminAccessEmailResult
  | { error: "SETUP_REQUEST_NOT_FOUND" | "SUBSCRIBER_SITE_NOT_PROVISIONED" | "SITE_ADMIN_EMAIL_REQUIRED" }
> {
  const resolved = await resolveSetupRequestAndSite(input.setupRequestId);
  if ("error" in resolved) return { error: resolved.error };

  const bodyEmail = input.email?.trim().toLowerCase() ?? "";
  const fallbackEmail = resolved.setupRequest.contactEmail?.trim().toLowerCase() ?? "";
  const targetEmail = bodyEmail || fallbackEmail;

  if (!targetEmail) {
    return { error: "SITE_ADMIN_EMAIL_REQUIRED" };
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
      displayName: existing.displayName ?? resolved.setupRequest.contactName ?? null,
      accessCode: generatedAccessCode,
      active: true,
      invitationStatus: nextInvitationStatus,
    });
  } else {
    await createCustomerSiteAdminUser({
      tenantSiteId: resolved.setupRequest.tenantSiteId,
      email: targetEmail,
      displayName: resolved.setupRequest.contactName ?? null,
      role: "OWNER",
      active: true,
      invitationStatus: "INVITED",
      accessCode: generatedAccessCode,
    });
  }

  const refreshedUser = await loadPreferredAdminUser(resolved.setupRequest.tenantSiteId, targetEmail);
  const siteSlug = resolved.setupRequest.tenantSite.slug;
  const loginPath = `/site-admin/${encodeURIComponent(siteSlug)}`;
  const loginUrl = absoluteSiteUrl(loginPath);
  const previewUrl = absoluteSiteUrl(`/sites/${encodeURIComponent(siteSlug)}`);

  const handoverEmail = businessAdminAccessHandoverEmail({
    businessName: resolved.setupRequest.businessName,
    siteSlug,
    loginUrl,
    previewUrl,
    adminEmail: refreshedUser?.email ?? targetEmail,
    accessCode: generatedAccessCode,
  });
  const emailResult = await sendTransactionalEmail({
    to: refreshedUser?.email ?? targetEmail,
    subject: handoverEmail.subject,
    text: handoverEmail.text,
    html: handoverEmail.html,
    replyTo: getOptionalServerEnv("PLATFORM_NOTIFICATION_EMAIL"),
  });

  return {
    access: toAccessResponse({
      setupRequestId: resolved.setupRequest.id,
      tenantSiteId: resolved.setupRequest.tenantSiteId,
      siteSlug,
      adminEmail: refreshedUser?.email ?? targetEmail,
      siteAdminUserId: refreshedUser?.id ?? null,
      accessCodeExists: Boolean(refreshedUser?.accessCodeHash),
      invitationStatus:
        (refreshedUser?.invitationStatus as "INVITED" | "ACTIVE" | "DISABLED" | undefined) ?? null,
      active: refreshedUser?.active ?? null,
    }),
    generatedAccessCode,
    emailSent: emailResult.ok,
    emailSkipped: emailResult.ok ? false : emailResult.skipped,
    emailStatus: emailResult.ok ? "SENT" : emailResult.reason,
  };
}

export async function resetAndEmailTenantSiteAdminAccess(input: {
  tenantSiteId: string;
  email?: string | null;
}): Promise<
  | {
      access: Omit<SetupRequestSiteAdminAccessResponse, "setupRequestId"> & { setupRequestId: string | null };
      generatedAccessCode: string;
      emailSent: boolean;
      emailSkipped: boolean;
      emailStatus: string;
    }
  | { error: "SUBSCRIBER_SITE_NOT_FOUND" | "SITE_ADMIN_EMAIL_REQUIRED" }
> {
  const site = await prisma.tenantSite.findUnique({
    where: { id: input.tenantSiteId },
    select: {
      id: true,
      slug: true,
      displayName: true,
      setupRequestId: true,
      setupRequest: {
        select: {
          id: true,
          contactName: true,
          contactEmail: true,
        },
      },
      customerSiteSettings: {
        select: {
          businessName: true,
          siteDisplayName: true,
          email: true,
        },
      },
    },
  });

  if (!site) return { error: "SUBSCRIBER_SITE_NOT_FOUND" };

  const bodyEmail = input.email?.trim().toLowerCase() ?? "";
  const fallbackEmail =
    site.setupRequest?.contactEmail?.trim().toLowerCase() ||
    site.customerSiteSettings?.email?.trim().toLowerCase() ||
    "";
  const targetEmail = bodyEmail || fallbackEmail;
  if (!targetEmail) return { error: "SITE_ADMIN_EMAIL_REQUIRED" };

  const existing = await loadPreferredAdminUser(site.id, targetEmail);
  const generatedAccessCode = generateTemporaryAccessCode(10);
  const displayName = site.setupRequest?.contactName ?? null;

  if (existing) {
    await updateCustomerSiteAdminUser({
      tenantSiteId: site.id,
      id: existing.id,
      displayName: existing.displayName ?? displayName,
      accessCode: generatedAccessCode,
      active: true,
      invitationStatus: existing.invitationStatus === "ACTIVE" ? "ACTIVE" : "INVITED",
    });
  } else {
    await createCustomerSiteAdminUser({
      tenantSiteId: site.id,
      email: targetEmail,
      displayName,
      role: "OWNER",
      active: true,
      invitationStatus: "INVITED",
      accessCode: generatedAccessCode,
    });
  }

  const refreshedUser = await loadPreferredAdminUser(site.id, targetEmail);
  const businessName = site.customerSiteSettings?.businessName || site.customerSiteSettings?.siteDisplayName || site.displayName || site.slug;
  const loginUrl = absoluteSiteUrl(`/site-admin/${encodeURIComponent(site.slug)}`);
  const previewUrl = absoluteSiteUrl(`/sites/${encodeURIComponent(site.slug)}`);
  const handoverEmail = businessAdminAccessHandoverEmail({
    businessName,
    siteSlug: site.slug,
    loginUrl,
    previewUrl,
    adminEmail: refreshedUser?.email ?? targetEmail,
    accessCode: generatedAccessCode,
  });
  const emailResult = await sendTransactionalEmail({
    to: refreshedUser?.email ?? targetEmail,
    subject: handoverEmail.subject,
    text: handoverEmail.text,
    html: handoverEmail.html,
    replyTo: getOptionalServerEnv("PLATFORM_NOTIFICATION_EMAIL"),
  });

  await prisma.siteStatusEvent.create({
    data: {
      tenantSiteId: site.id,
      eventType: "SITE_ADMIN_ACCESS_RESET",
      message: `Business admin password reset/email attempted for ${refreshedUser?.email ?? targetEmail}.`,
      metadata: {
        setupRequestId: site.setupRequestId,
        emailSent: emailResult.ok,
        emailStatus: emailResult.ok ? "SENT" : emailResult.reason,
      },
    },
  });

  return {
    access: {
      setupRequestId: site.setupRequestId,
      tenantSiteId: site.id,
      siteSlug: site.slug,
      adminEmail: refreshedUser?.email ?? targetEmail,
      siteAdminUserId: refreshedUser?.id ?? null,
      accessCodeExists: Boolean(refreshedUser?.accessCodeHash),
      invitationStatus:
        (refreshedUser?.invitationStatus as "INVITED" | "ACTIVE" | "DISABLED" | undefined) ?? null,
      active: refreshedUser?.active ?? null,
    },
    generatedAccessCode,
    emailSent: emailResult.ok,
    emailSkipped: emailResult.ok ? false : emailResult.skipped,
    emailStatus: emailResult.ok ? "SENT" : emailResult.reason,
  };
}

export async function ensureInitialSetupRequestSiteAdminAccess(
  setupRequestId: string,
): Promise<SetupRequestSiteAdminAccessEmailResult | null> {
  const current = await getSetupRequestSiteAdminAccess(setupRequestId);
  if ("error" in current) return null;
  if (current.accessCodeExists) {
    return {
      access: current,
      generatedAccessCode: null,
      emailSent: false,
      emailSkipped: false,
      emailStatus: "EXISTING_ACCESS_REUSED",
    };
  }

  const generated = await resetAndEmailSetupRequestSiteAdminAccess({ setupRequestId });
  if ("error" in generated) return null;
  return generated;
}
