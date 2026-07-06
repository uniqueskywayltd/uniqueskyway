import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { referralAdminService } from "@/lib/services/referral-admin.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.REFERRALS_READ);
  if (!auth.ok) return auth.response;

  const view = request.nextUrl.searchParams.get("view");

  if (view === "commissions") {
    const result = await referralAdminService.listCommissions(
      Number(request.nextUrl.searchParams.get("page") ?? 1),
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 503 });
    }
    return NextResponse.json(result.data);
  }

  const result = await referralAdminService.getOverview();
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}
