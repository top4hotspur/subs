import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { getOptionalServerEnv } from "@/lib/config/server-env";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import {
  buildSetupConfirmationParams,
} from "@/lib/setup/setup-confirmation-token";
import {
  createSetupRequest,
  listSetupRequests,
} from "@/lib/setup/setup-request-repository";
import {
  createSetupRequestSchema,
  listSetupRequestsSchema,
} from "@/lib/setup/setup-request-schema";
import { sendTransactionalEmail } from "@/lib/email/email-provider";
import {
  setupRequestAdminNotification,
  setupRequestCustomerConfirmation,
} from "@/lib/email/email-templates";

const MIN_SETUP_FORM_COMPLETION_MS = 3000;

function looksGibberish(value: string | undefined | null): boolean {
  if (!value) return false;
  const clean = value.trim();
  if (clean.length < 3) return true;
  const consonantRuns = clean.match(/[bcdfghjklmnpqrstvwxyz]{6,}/gi);
  return Boolean(consonantRuns);
}

function hasPlausiblePhoneDigits(phone: string | undefined | null): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function POST(request: NextRequest) {
  if (!isBackendPersistenceConfigured()) {
    return backendNotConfigured();
  }

  try {
    const body = await request.json();
    const input = createSetupRequestSchema.parse(body);
    const startedAt = input.formStartedAt ?? 0;
    const elapsed = Date.now() - startedAt;
    if ((input.honeypot && input.honeypot.trim().length > 0) || (startedAt > 0 && elapsed < MIN_SETUP_FORM_COMPLETION_MS)) {
      return NextResponse.json({ ok: true, accepted: false }, { status: 202 });
    }

    if (
      input.businessName.trim().length < 2 ||
      (input.contactName && (input.contactName.trim().length < 2 || looksGibberish(input.contactName))) ||
      !hasPlausiblePhoneDigits(input.contactPhone) ||
      (input.notes && input.notes.length > 1200) ||
      (input.desiredDomain && input.desiredDomain.length > 500) ||
      (input.existingDomain && input.existingDomain.length > 200)
    ) {
      return NextResponse.json({ ok: true, accepted: false }, { status: 202 });
    }

    const { setupRequest, confirmationToken } = await createSetupRequest(input);
    const confirmationUrl = `/setup/confirmation?${buildSetupConfirmationParams(
      setupRequest.id,
      confirmationToken,
    ).toString()}`;

    const platformNotifyEmail = getOptionalServerEnv("PLATFORM_NOTIFICATION_EMAIL");
    const adminEmailStatus = platformNotifyEmail
      ? await sendTransactionalEmail({
          to: platformNotifyEmail,
          ...setupRequestAdminNotification(setupRequest),
          replyTo: setupRequest.contactEmail ?? undefined,
        })
      : { ok: false as const, skipped: true as const, reason: "EMAIL_NOT_CONFIGURED" as const };

    const customerEmailStatus = setupRequest.contactEmail
      ? await sendTransactionalEmail({
          to: setupRequest.contactEmail,
          ...setupRequestCustomerConfirmation(setupRequest, confirmationUrl),
          replyTo: platformNotifyEmail ?? undefined,
        })
      : { ok: false as const, skipped: true as const, reason: "EMAIL_NOT_CONFIGURED" as const };

    return NextResponse.json(
      {
        ok: true,
        setupRequest,
        confirmationToken,
        confirmationUrl,
        emailStatus: {
          adminNotification: adminEmailStatus,
          customerConfirmation: customerEmailStatus,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "SETUP_REQUEST_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isBackendPersistenceConfigured()) {
    return backendNotConfigured();
  }

  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const search = request.nextUrl.searchParams;
    const parsed = listSetupRequestsSchema.parse({
      tenantSiteId: search.get("tenantSiteId") ?? undefined,
      industrySlug: search.get("industrySlug") ?? undefined,
      status: search.get("status") ?? undefined,
      contactEmail: search.get("contactEmail") ?? undefined,
      take: search.get("take") ? Number(search.get("take")) : undefined,
      skip: search.get("skip") ? Number(search.get("skip")) : undefined,
    });

    const setupRequests = await listSetupRequests(parsed);
    return NextResponse.json({ ok: true, setupRequests });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "SETUP_REQUEST_LIST_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
