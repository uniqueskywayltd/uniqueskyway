import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { activityFeedService } from "@/lib/services/activity-feed.service";
import type { ActivityFeedType } from "@/lib/constants/trust-components";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(PERMISSIONS.SETTINGS_MANAGE);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = await request.json();

  const result = await activityFeedService.update(
    id,
    {
      type: body.type as ActivityFeedType | undefined,
      title: body.title,
      customerNameMasked: body.customerNameMasked,
      city: body.city,
      country: body.country,
      amount: body.amount != null ? String(body.amount) : undefined,
      currency: body.currency,
      investmentPlan: body.investmentPlan,
      isVisible: body.isVisible,
      priority: body.priority,
      startsAt: body.startsAt ? new Date(body.startsAt) : body.startsAt,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : body.expiresAt,
    },
    auth.ctx.adminId,
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(PERMISSIONS.SETTINGS_MANAGE);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const result = await activityFeedService.delete(id, auth.ctx.adminId);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
