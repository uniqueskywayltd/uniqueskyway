import { NextResponse, type NextRequest } from "next/server";
import { enforceRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { getRequestContextFromRequest } from "@/lib/security/request-context";
import type { ActorContext } from "@/lib/services/types";

type RateLimitProfile = "auth" | "api" | "publicForm";

export function getActorFromRequest(request: NextRequest): ActorContext {
  const ctx = getRequestContextFromRequest(request);
  return {
    ipAddress: ctx.ipAddress ?? undefined,
    userAgent: ctx.userAgent ?? undefined,
    deviceFingerprint: ctx.deviceFingerprint ?? undefined,
  };
}

export function rateLimitedResponse(
  request: NextRequest,
  profile: RateLimitProfile,
  prefix: string,
): NextResponse | null {
  const { ipAddress } = getRequestContextFromRequest(request);
  const key = `${prefix}:${ipAddress ?? "unknown"}`;
  const result = enforceRateLimit(key, profile);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: rateLimitHeaders(result) },
    );
  }

  return null;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonSuccess<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
