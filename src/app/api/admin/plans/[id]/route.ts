import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { investmentPlanService } from "@/lib/services/investment-plan.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(PERMISSIONS.PLANS_READ);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await investmentPlanService.getAdminById(id);

  if (!result.success || !result.data) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(PERMISSIONS.PLANS_MANAGE);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const action = body.action as string;

  if (action === "archive") {
    const r = await investmentPlanService.archivePlan(id, auth.ctx.adminId);
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (action === "duplicate") {
    const r = await investmentPlanService.duplicatePlan(id, auth.ctx.adminId);
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json(r.data);
  }

  const r = await investmentPlanService.updatePlan(id, {
    ...body,
    adminUserId: auth.ctx.adminId,
  });

  if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
