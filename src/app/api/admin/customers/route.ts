import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { customerAdminService } from "@/lib/services/customer-admin.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.USERS_READ);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const result = await customerAdminService.listForAdmin({
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 20),
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}
