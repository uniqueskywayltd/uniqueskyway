import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { auditService } from "@/lib/services/audit.service";
import { notificationService } from "@/lib/services/notification.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.EMAIL_BROADCAST);
  if (!auth.ok) return auth.response;

  const result = await notificationService.listAdminDeliveries(
    Number(request.nextUrl.searchParams.get("page") ?? 1),
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.EMAIL_BROADCAST);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const action = body.action as string;

  if (action === "broadcast_in_app") {
    const result = await notificationService.broadcastInApp({
      title: body.title,
      body: body.body,
      profileIds: body.profileIds,
      adminUserId: auth.ctx.adminId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    await auditService.log({
      action: "create",
      entityType: "notification_broadcast",
      actor: { adminUserId: auth.ctx.adminId },
      metadata: { title: body.title, sent: result.data.sent },
    });

    return NextResponse.json(result.data);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
