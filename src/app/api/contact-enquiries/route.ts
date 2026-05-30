import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createContactEnquiry } from "@/lib/contact/contact-enquiry-repository";
import { createContactEnquirySchema } from "@/lib/contact/contact-enquiry-schema";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { getOptionalServerEnv } from "@/lib/config/server-env";
import { contactEnquiryAdminNotification } from "@/lib/email/email-templates";
import { sendTransactionalEmail } from "@/lib/email/email-provider";

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
    const input = createContactEnquirySchema.parse(body);
    const enquiry = await createContactEnquiry(input);
    const notifyEmail = getOptionalServerEnv("PLATFORM_NOTIFICATION_EMAIL");
    const emailStatus = notifyEmail
      ? await sendTransactionalEmail({
          to: notifyEmail,
          ...contactEnquiryAdminNotification({
            ...input,
            createdAt: enquiry.createdAt,
          }),
          replyTo: input.email,
        })
      : { ok: false as const, skipped: true as const, reason: "EMAIL_NOT_CONFIGURED" as const };

    if (!emailStatus.ok) {
      console.info("[contact-enquiries] notification email not sent", {
        status: emailStatus.skipped ? "SKIPPED" : "FAILED",
        reason: emailStatus.reason,
      });
    } else {
      console.info("[contact-enquiries] notification email sent", {
        status: "SENT",
      });
    }

    return NextResponse.json(
      {
        ok: true,
        enquiry: {
          id: enquiry.id,
          createdAt: enquiry.createdAt,
          status: enquiry.status,
        },
        emailStatus,
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
        error: "CONTACT_ENQUIRY_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
