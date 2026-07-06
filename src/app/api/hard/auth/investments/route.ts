import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { investmentAdminService } from "@/lib/services/investment-admin.service";
import { roiSchedulerService } from "@/lib/services/roi-scheduler.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.INVESTMENTS_READ);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const result = await investmentAdminService.listForAdmin({
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 20),
    status: searchParams.get("status") ?? undefined,
    planId: searchParams.get("planId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    isPaused:
      searchParams.get("isPaused") === "true"
        ? true
        : searchParams.get("isPaused") === "false"
          ? false
          : undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.INVESTMENTS_MANAGE);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const action = body.action as "run_roi" | "dry_run_roi";

  if (action === "run_roi" || action === "dry_run_roi") {
    const result = await roiSchedulerService.run({
      dryRun: action === "dry_run_roi",
      recovery: body.recovery === true,
      investmentId: body.investmentId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 503 });
    }

    return NextResponse.json(result.data);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
