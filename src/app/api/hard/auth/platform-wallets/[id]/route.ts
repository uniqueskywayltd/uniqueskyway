import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { platformWalletService } from "@/lib/services/platform-wallet.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(PERMISSIONS.PLATFORM_WALLETS_READ);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const result = await platformWalletService.getById(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(PERMISSIONS.PLATFORM_WALLETS_MANAGE);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const result = await platformWalletService.softDelete(id, auth.ctx.adminId);
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
