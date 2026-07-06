import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { auditService } from "@/lib/services/audit.service";
import { settingsService } from "@/lib/services/settings.service";
import type { SystemSettingKey } from "@/lib/constants/system-settings";

export async function GET() {
  const auth = await requireAdmin(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) return auth.response;

  const result = await settingsService.listAll();
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.SETTINGS_MANAGE);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const result = await settingsService.update(
    body.key as SystemSettingKey,
    body.value,
    auth.ctx.adminId,
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  await auditService.log({
    action: "update",
    entityType: "system_setting",
    entityId: body.key,
    actor: { adminUserId: auth.ctx.adminId },
    afterState: { value: body.value },
  });

  return NextResponse.json({ success: true });
}
