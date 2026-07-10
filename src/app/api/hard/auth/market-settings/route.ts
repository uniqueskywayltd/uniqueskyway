import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { marketDataService } from "@/lib/services/market-data.service";

export async function GET() {
  const auth = await requireAdmin(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) return auth.response;

  const config = await marketDataService.getConfig();
  const ticker = await marketDataService.getTicker();

  return NextResponse.json({
    config,
    preview: ticker.success ? ticker.data : null,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.SETTINGS_MANAGE);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const result = await marketDataService.updateConfig(body.config ?? {}, auth.ctx.adminId);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ config: result.data });
}
