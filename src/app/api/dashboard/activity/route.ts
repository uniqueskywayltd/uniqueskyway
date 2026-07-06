import { NextResponse, type NextRequest } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { auditService } from "@/lib/services/audit.service";

export async function GET(request: NextRequest) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const result = await auditService.getTimelineForProfile(
    auth.ctx.profile.id,
    Number(searchParams.get("page") ?? 1),
    Number(searchParams.get("pageSize") ?? 20),
    searchParams.get("category") ?? undefined,
  );

  if (!result.success) {
    const status = result.error.code === "INFRASTRUCTURE_NOT_CONFIGURED" ? 503 : 500;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status });
  }

  return NextResponse.json(result.data);
}
