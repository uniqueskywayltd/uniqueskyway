import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { reportingService } from "@/lib/services/reporting.service";
import { roiSchedulerService } from "@/lib/services/roi-scheduler.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.AUDIT_READ);
  if (!auth.ok) return auth.response;

  const report = request.nextUrl.searchParams.get("report");

  if (report === "daily") {
    const result = await reportingService.getDailyActivity(
      Number(request.nextUrl.searchParams.get("days") ?? 30),
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 503 });
    }
    return NextResponse.json(result.data);
  }

  if (report === "referrals") {
    const result = await reportingService.getReferralPerformance();
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 503 });
    }
    return NextResponse.json(result.data);
  }

  if (report === "investments") {
    const result = await reportingService.getInvestmentPerformance();
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 503 });
    }
    return NextResponse.json(result.data);
  }

  if (report === "roi-runs") {
    const result = await roiSchedulerService.listRuns(
      Number(request.nextUrl.searchParams.get("page") ?? 1),
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 503 });
    }
    return NextResponse.json(result.data);
  }

  const [daily, referrals, investments] = await Promise.all([
    reportingService.getDailyActivity(7),
    reportingService.getReferralPerformance(5),
    reportingService.getInvestmentPerformance(),
  ]);

  return NextResponse.json({
    daily: daily.success ? daily.data : [],
    referrals: referrals.success ? referrals.data : null,
    investments: investments.success ? investments.data : null,
  });
}
