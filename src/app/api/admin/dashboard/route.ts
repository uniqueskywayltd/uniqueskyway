import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { adminDashboardService } from "@/lib/services/admin-dashboard.service";

export async function GET() {
  const auth = await requireAdmin(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) return auth.response;

  const result = await adminDashboardService.getExecutiveDashboard();
  if (!result.success) {
    const status = result.error.code === "INFRASTRUCTURE_NOT_CONFIGURED" ? 503 : 500;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json(result.data);
}
