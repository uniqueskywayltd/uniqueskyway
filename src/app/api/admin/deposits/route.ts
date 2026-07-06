import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { depositService } from "@/lib/services/deposit.service";
import type { DepositStatus } from "@/types/domain";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.DEPOSITS_READ);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const result = await depositService.listForAdmin({
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 20),
    status: searchParams.get("status") as DepositStatus | undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!result.success) {
    const status = result.error.code === "INFRASTRUCTURE_NOT_CONFIGURED" ? 503 : 500;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json(result.data);
}
