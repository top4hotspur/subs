import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  createSiteStatusEvent,
  updateProvisioningTaskStatus,
} from "@/lib/sites/site-provisioning-repository";
import { updateProvisioningTaskStatusSchema } from "@/lib/sites/site-provisioning-schema";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id, taskId } = await context.params;
    const body = await request.json();
    const parsed = updateProvisioningTaskStatusSchema.parse({
      taskId,
      status: body?.status,
      notes: body?.notes,
      metadata: body?.metadata,
    });

    const task = await updateProvisioningTaskStatus(parsed);
    await createSiteStatusEvent({
      tenantSiteId: id,
      eventType: "TASK_STATUS_UPDATED",
      message: `Task '${task.title}' status updated to ${task.status}.`,
      metadata: { taskId: task.id, taskType: task.taskType, status: task.status },
    });
    return NextResponse.json({ ok: true, task });
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
        error: "TASK_STATUS_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
