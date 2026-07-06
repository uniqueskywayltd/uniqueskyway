import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { featureFlagService } from "@/lib/services/feature-flags.service";
import type { FeatureFlagKey } from "@/lib/constants/feature-flags";

export async function GET() {
  const auth = await requireAdmin(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) return auth.response;

  const result = await featureFlagService.getAll();
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.FEATURE_FLAGS_MANAGE);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const result = await featureFlagService.setEnabled(
    body.key as FeatureFlagKey,
    Boolean(body.enabled),
    auth.ctx.adminId,
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
