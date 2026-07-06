import { NextResponse, type NextRequest } from "next/server";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { getRequestContextFromRequest } from "@/lib/security/request-context";
import { settingsService } from "@/lib/services/settings.service";

export async function GET(request: NextRequest) {
  const { ipAddress } = getRequestContextFromRequest(request);
  const rateLimit = enforceRateLimit(`public-settings:${ipAddress ?? "unknown"}`, "api");

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const result = await settingsService.getPublic();

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 503, headers: rateLimitHeaders(rateLimit) },
    );
  }

  return NextResponse.json(result.data, { headers: rateLimitHeaders(rateLimit) });
}
