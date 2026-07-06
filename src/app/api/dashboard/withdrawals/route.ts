import { NextResponse, type NextRequest } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { withdrawalService } from "@/lib/services/withdrawal.service";
import type { WithdrawalStatus } from "@/types/domain";

export async function GET(request: NextRequest) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const result = await withdrawalService.listForProfile(auth.ctx.profile.id, {
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 20),
    status: status ? (status as WithdrawalStatus) : undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!result.success) {
    const code = result.error.code === "INFRASTRUCTURE_NOT_CONFIGURED" ? 503 : 500;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: code });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const body = await request.json();

  const result = await withdrawalService.submitWithdrawal({
    profileId: auth.ctx.profile.id,
    methodSlug: body.methodSlug,
    amount: body.amount,
    destination: body.destination ?? {},
    currency: body.currency,
    idempotencyKey: body.idempotencyKey ?? `withdrawal-${auth.ctx.profile.id}-${Date.now()}`,
    actor: {
      profileId: auth.ctx.profile.id,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    },
  });

  if (!result.success) {
    const status =
      result.error.code === "INFRASTRUCTURE_NOT_CONFIGURED"
        ? 503
        : result.error.code === "FEATURE_DISABLED" || result.error.code === "MAINTENANCE_MODE"
          ? 403
          : 400;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status });
  }

  return NextResponse.json(result.data, { status: 201 });
}
