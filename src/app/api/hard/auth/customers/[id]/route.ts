import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, requireAdminAny } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { customerAdminService } from "@/lib/services/customer-admin.service";
import { ledgerAdminService } from "@/lib/services/ledger-admin.service";

const STATUS_ACTIONS = new Set(["suspend", "activate"]);
const LOGIN_ACTIONS = new Set(["disable_login", "enable_login"]);
const LOCK_ACTIONS = new Set(["lock", "unlock"]);
const SUPPORT_ACTIONS = new Set(["force_verify", "reset_password", "add_note"]);
const LEDGER_ACTIONS = new Set(["fund", "debit"]);
const REASON_REQUIRED = new Set(["suspend", "disable_login", "lock", "fund", "debit"]);

function permissionsForAction(action: string) {
  if (LEDGER_ACTIONS.has(action)) {
    return [PERMISSIONS.LEDGER_ADJUST];
  }
  if (STATUS_ACTIONS.has(action) || LOGIN_ACTIONS.has(action) || LOCK_ACTIONS.has(action)) {
    return [PERMISSIONS.USERS_WRITE, PERMISSIONS.USERS_SUSPEND];
  }
  if (SUPPORT_ACTIONS.has(action)) {
    return [PERMISSIONS.USERS_WRITE, PERMISSIONS.SUPPORT_MANAGE];
  }
  return [PERMISSIONS.USERS_WRITE];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAny([PERMISSIONS.USERS_READ, PERMISSIONS.SUPPORT_READ]);
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
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const action = (body as { action?: string }).action as string;
  const reason = typeof (body as { reason?: string }).reason === "string" ? (body as { reason: string }).reason.trim() : "";

  const auth = await requireAdminAny(permissionsForAction(action));
  if (!auth.ok) return auth.response;

  if (REASON_REQUIRED.has(action) && !reason) {
    return NextResponse.json({ error: "A reason is required for this action" }, { status: 400 });
  }

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
    const content = typeof (body as { content?: string }).content === "string"
      ? (body as { content: string }).content.trim()
      : "";
    if (!content) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }
    const r = await customerAdminService.addNote({
      profileId: id,
      adminUserId: auth.ctx.adminId,
      content,
    });
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json(r.data);
  }

  if (action === "fund" || action === "debit") {
    const amount = typeof (body as { amount?: string }).amount === "string"
      ? (body as { amount: string }).amount.trim()
      : "";
    const accountType = (body as { accountType?: string }).accountType ?? "available";

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Enter a valid amount greater than zero" }, { status: 400 });
    }

    const validAccounts = new Set(["available", "invested", "referral", "pending_withdrawal"]);
    if (!validAccounts.has(accountType)) {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
    }

    const r = await ledgerAdminService.postCorrection({
      profileId: id,
      accountType: accountType as "available" | "invested" | "referral" | "pending_withdrawal",
      direction: action === "fund" ? "credit" : "debit",
      amount,
      reason,
      adminUserId: auth.ctx.adminId,
    });
    if (!r.success) return NextResponse.json({ error: r.error.message }, { status: 400 });
    return NextResponse.json({ success: true, entryId: r.data.entryId });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
