import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { riskService } from "@/lib/services/risk.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.COMPLIANCE_READ);
  if (!auth.ok) return auth.response;

  const view = request.nextUrl.searchParams.get("view");

  if (view === "insights") {
    const result = await riskService.getInsights();
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 503 });
    }
    return NextResponse.json(result.data);
  }

  const result = await riskService.listForAdmin({
    page: Number(request.nextUrl.searchParams.get("page") ?? 1),
    severity: (request.nextUrl.searchParams.get("severity") as never) ?? undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}
