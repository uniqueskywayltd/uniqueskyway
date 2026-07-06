import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { investmentPlanService } from "@/lib/services/investment-plan.service";

export async function GET() {
  const auth = await requireAdmin(PERMISSIONS.PLANS_READ);
  if (!auth.ok) return auth.response;

  const result = await investmentPlanService.listAllAdmin();
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.PLANS_MANAGE);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const result = await investmentPlanService.createPlan({
    ...body,
    adminUserId: auth.ctx.adminId,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
