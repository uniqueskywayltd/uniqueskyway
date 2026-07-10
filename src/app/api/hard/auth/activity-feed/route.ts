import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { activityFeedService } from "@/lib/services/activity-feed.service";
import type { ActivityFeedType } from "@/lib/constants/trust-components";

export async function GET() {
  const auth = await requireAdmin(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) return auth.response;

  const [items, config] = await Promise.all([
    activityFeedService.listAdmin(),
    activityFeedService.getConfig(),
  ]);

  if (!items.success) {
    return NextResponse.json({ error: items.error.message }, { status: 503 });
  }

  const realCount = await activityFeedService.countRealActivities();

  return NextResponse.json({
    items: items.data,
    config,
    realActivityCount: realCount,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.SETTINGS_MANAGE);
  if (!auth.ok) return auth.response;

  const body = await request.json();

  if (body.action === "update_config") {
    const result = await activityFeedService.updateConfig(body.config ?? {}, auth.ctx.adminId);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    return NextResponse.json({ config: result.data });
  }

  const result = await activityFeedService.create(
    {
      type: body.type as ActivityFeedType,
      title: body.title,
      customerNameMasked: body.customerNameMasked,
      city: body.city,
      country: body.country,
      amount: body.amount != null ? String(body.amount) : null,
      currency: body.currency,
      investmentPlan: body.investmentPlan,
      isVisible: body.isVisible,
      priority: body.priority,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
    auth.ctx.adminId,
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
