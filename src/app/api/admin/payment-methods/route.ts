import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { paymentMethodService } from "@/lib/services/payment-method.service";

export async function GET() {
  const auth = await requireAdmin(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) return auth.response;

  const result = await paymentMethodService.listAllAdmin();
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.SETTINGS_MANAGE);
  if (!auth.ok) return auth.response;

  const body = await request.json();

  if (body.id) {
    const result = await paymentMethodService.updateAdmin({
      id: body.id,
      adminUserId: auth.ctx.adminId,
      ...body,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  const result = await paymentMethodService.createAdmin({
    ...body,
    adminUserId: auth.ctx.adminId,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
