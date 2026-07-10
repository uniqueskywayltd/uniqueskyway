import { NextResponse } from "next/server";
import { activityFeedService } from "@/lib/services/activity-feed.service";

export async function GET() {
  const result = await activityFeedService.getPublicFeed();
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
