import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { customerAdminService } from "@/lib/services/customer-admin.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(PERMISSIONS.USERS_READ);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await customerAdminService.getDetail(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(PERMISSIONS.USERS_WRITE);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const action = body.action as string;
  const reason = body.reason ?? "";

  if (action === "suspend") {
    const r = await customerAdminService.updateStatus({
      profileId: id,
      status: "suspended",
      adminUserId: auth.ctx.adminId,
      reason,
    });
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (action === "activate") {
    const r = await customerAdminService.updateStatus({
      profileId: id,
      status: "active",
      adminUserId: auth.ctx.adminId,
      reason,
    });
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (action === "disable_login") {
    const r = await customerAdminService.setLoginDisabled({
      profileId: id,
      disabled: true,
      adminUserId: auth.ctx.adminId,
      reason,
    });
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (action === "enable_login") {
    const r = await customerAdminService.setLoginDisabled({
      profileId: id,
      disabled: false,
      adminUserId: auth.ctx.adminId,
      reason,
    });
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (action === "lock") {
    const r = await customerAdminService.lockAccount({
      profileId: id,
      adminUserId: auth.ctx.adminId,
      reason,
    });
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (action === "unlock") {
    const r = await customerAdminService.unlockAccount({
      profileId: id,
      adminUserId: auth.ctx.adminId,
      reason,
    });
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (action === "force_verify") {
    const r = await customerAdminService.forceEmailVerification({
      profileId: id,
      adminUserId: auth.ctx.adminId,
    });
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (action === "reset_password") {
    const r = await customerAdminService.initiatePasswordReset({
      profileId: id,
      adminUserId: auth.ctx.adminId,
    });
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json(r.data);
  }

  if (action === "add_note") {
    const r = await customerAdminService.addNote({
      profileId: id,
      adminUserId: auth.ctx.adminId,
      content: body.content ?? "",
    });
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json(r.data);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
