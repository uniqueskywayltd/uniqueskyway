import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { ledgerAdminService } from "@/lib/services/ledger-admin.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.LEDGER_READ);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const result = await ledgerAdminService.listEntries({
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 30),
    profileId: searchParams.get("profileId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    entryType: (searchParams.get("entryType") as never) ?? undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.LEDGER_ADJUST);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const result = await ledgerAdminService.postCorrection({
    profileId: body.profileId,
    accountType: body.accountType,
    direction: body.direction,
    amount: body.amount,
    reason: body.reason,
    adminUserId: auth.ctx.adminId,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
