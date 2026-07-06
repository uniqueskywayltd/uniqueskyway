import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { adminAuditService } from "@/lib/services/admin-audit.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.AUDIT_READ);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const result = await adminAuditService.list({
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 30),
    search: searchParams.get("search") ?? undefined,
    action: (searchParams.get("action") as never) ?? undefined,
    entityType: searchParams.get("entityType") ?? undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}
