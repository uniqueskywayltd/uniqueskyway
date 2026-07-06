import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { adminSearchService } from "@/lib/services/admin-search.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.USERS_READ);
  if (!auth.ok) return auth.response;

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const result = await adminSearchService.search(q);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}
