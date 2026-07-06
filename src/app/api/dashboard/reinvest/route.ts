import { NextResponse, type NextRequest } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { reinvestmentService } from "@/lib/services/reinvestment.service";

export async function POST(request: NextRequest) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const body = await request.json();

  const result = await reinvestmentService.reinvest({
    profileId: auth.ctx.profile.id,
    planId: body.planId,
    amount: body.amount,
    idempotencyKey: body.idempotencyKey ?? `reinvest-${auth.ctx.profile.id}-${Date.now()}`,
    parentInvestmentId: body.parentInvestmentId,
    actor: { profileId: auth.ctx.profile.id },
  });

  if (!result.success) {
    const status =
      result.error.code === "INSUFFICIENT_FUNDS" ||
      result.error.code === "INVALID_AMOUNT" ||
      result.error.code === "AMOUNT_TOO_LOW" ||
      result.error.code === "AMOUNT_TOO_HIGH"
        ? 400
        : result.error.code === "DUPLICATE_REQUEST"
          ? 409
          : 503;
    return NextResponse.json(
      { error: result.error.message, code: result.error.code },
      { status },
    );
  }

  return NextResponse.json(result.data);
}
