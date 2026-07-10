import { NextResponse, type NextRequest } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { depositService } from "@/lib/services/deposit.service";
import type { DepositStatus } from "@/types/domain";

export async function GET(request: NextRequest) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const result = await depositService.listForProfile(auth.ctx.profile.id, {
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 20),
    status: status ? (status as DepositStatus) : undefined,
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

  const result = await depositService.submitDeposit({
    profileId: auth.ctx.profile.id,
    planId: body.planId,
    paymentMethodSlug: body.paymentMethodSlug,
    platformWalletId: body.platformWalletId,
    amount: body.amount,
    externalTransactionRef: body.externalTransactionRef,
    currency: body.currency,
    idempotencyKey: body.idempotencyKey ?? `deposit-${auth.ctx.profile.id}-${Date.now()}`,
    proofStoragePath: body.proofStoragePath,
    actor: { profileId: auth.ctx.profile.id },
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
