import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { withdrawalService } from "@/lib/services/withdrawal.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(PERMISSIONS.WITHDRAWALS_READ);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await withdrawalService.getReviewContext(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(PERMISSIONS.WITHDRAWALS_APPROVE);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const action = body.action as
    | "approve"
    | "reject"
    | "request_info"
    | "mark_processing"
    | "mark_completed";

  if (action === "approve") {
    const result = await withdrawalService.approveWithdrawal(
      id,
      auth.ctx.adminId,
      body.internalNotes,
    );
    if (!result.success) {
      const status = result.error.code === "ALREADY_PROCESSED" ? 409 : 400;
      return NextResponse.json({ error: result.error.message, code: result.error.code }, { status });
    }
    return NextResponse.json(result.data);
  }

  if (action === "reject") {
    const rejectAuth = await requireAdmin(PERMISSIONS.WITHDRAWALS_REJECT);
    if (!rejectAuth.ok) return rejectAuth.response;

    const result = await withdrawalService.rejectWithdrawal(
      id,
      auth.ctx.adminId,
      body.reason ?? "Rejected by administrator",
      body.internalNotes,
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "request_info") {
    const result = await withdrawalService.requestAdditionalInfo(
      id,
      auth.ctx.adminId,
      body.message ?? "Additional information required",
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "mark_processing") {
    const result = await withdrawalService.markProcessing(id, auth.ctx.adminId);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "mark_completed") {
    const result = await withdrawalService.markCompleted(
      id,
      auth.ctx.adminId,
      body.payoutReference,
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
