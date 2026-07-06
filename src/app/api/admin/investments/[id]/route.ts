import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { investmentAdminService } from "@/lib/services/investment-admin.service";
import { investmentEngine } from "@/lib/services/investment-engine.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(PERMISSIONS.INVESTMENTS_READ);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await investmentAdminService.getDetail(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(PERMISSIONS.INVESTMENTS_MANAGE);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const action = body.action as "pause" | "resume" | "force_maturity" | "manual_adjustment";

  if (action === "pause") {
    const result = await investmentEngine.pauseInvestment(id, auth.ctx.adminId);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "resume") {
    const result = await investmentEngine.resumeInvestment(id, auth.ctx.adminId);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "force_maturity") {
    const result = await investmentEngine.forceMaturity(id, auth.ctx.adminId);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "manual_adjustment") {
    const adjustAuth = await requireAdmin(PERMISSIONS.LEDGER_ADJUST);
    if (!adjustAuth.ok) return adjustAuth.response;

    const result = await investmentAdminService.manualAdjustment({
      investmentId: id,
      amount: body.amount,
      direction: body.direction,
      reason: body.reason ?? "",
      adminUserId: auth.ctx.adminId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
