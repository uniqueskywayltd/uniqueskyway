import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { depositService } from "@/lib/services/deposit.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(PERMISSIONS.DEPOSITS_READ);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await depositService.getByIdForAdmin(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(PERMISSIONS.DEPOSITS_APPROVE);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const action = body.action as "approve" | "reject" | "request_info";

  if (action === "approve") {
    const result = await depositService.approveDeposit(
      id,
      auth.ctx.adminId,
      auth.ctx.authUserId,
      body.internalNotes,
    );
    if (!result.success) {
      const status = result.error.code === "ALREADY_PROCESSED" ? 409 : 400;
      return NextResponse.json({ error: result.error.message, code: result.error.code }, { status });
    }
    return NextResponse.json(result.data);
  }

  if (action === "reject") {
    const rejectAuth = await requireAdmin(PERMISSIONS.DEPOSITS_REJECT);
    if (!rejectAuth.ok) return rejectAuth.response;

    const result = await depositService.rejectDeposit(
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
    const result = await depositService.requestAdditionalInfo(
      id,
      auth.ctx.adminId,
      body.message ?? "Additional information required",
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
