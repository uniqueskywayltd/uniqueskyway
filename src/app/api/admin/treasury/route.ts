import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { treasuryService } from "@/lib/services/treasury.service";
import { withdrawalService } from "@/lib/services/withdrawal.service";
import type { PayoutStatus } from "@/types/domain";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.WITHDRAWALS_READ);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "queue") {
    const status = searchParams.get("status");
    const result = await treasuryService.listQueue({
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 20),
      status: status ? (status as PayoutStatus) : undefined,
    });
    if (!result.success) {
      const code = result.error.code === "INFRASTRUCTURE_NOT_CONFIGURED" ? 503 : 500;
      return NextResponse.json({ error: result.error.message }, { status: code });
    }
    return NextResponse.json(result.data);
  }

  const [treasuryStats, withdrawalStats] = await Promise.all([
    treasuryService.getStats(),
    withdrawalService.getAdminStats(),
  ]);

  if (!treasuryStats.success || !withdrawalStats.success) {
    const err = treasuryStats.success ? withdrawalStats : treasuryStats;
    if (!err.success) {
      const code = err.error.code === "INFRASTRUCTURE_NOT_CONFIGURED" ? 503 : 500;
      return NextResponse.json({ error: err.error.message }, { status: code });
    }
  }

  return NextResponse.json({
    treasury: treasuryStats.success ? treasuryStats.data : null,
    withdrawals: withdrawalStats.success ? withdrawalStats.data : null,
  });
}
