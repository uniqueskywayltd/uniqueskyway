import { NextResponse, type NextRequest } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { notificationService } from "@/lib/services/notification.service";

export async function GET(request: NextRequest) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const result = await notificationService.listForProfile(auth.ctx.profile.id, {
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 20),
    unreadOnly: searchParams.get("unreadOnly") === "true",
    includeArchived: searchParams.get("archived") === "true",
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json(result.data);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { action, notificationId } = body as {
    action: "read" | "readAll" | "archive";
    notificationId?: string;
  };

  if (action === "readAll") {
    await notificationService.markAllRead(auth.ctx.profile.id);
  } else if (action === "read" && notificationId) {
    await notificationService.markRead(auth.ctx.profile.id, notificationId);
  } else if (action === "archive" && notificationId) {
    await notificationService.archive(auth.ctx.profile.id, notificationId);
  }

  return NextResponse.json({ success: true });
}
