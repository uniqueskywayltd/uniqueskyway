import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
  deviceFingerprint: string | null;
};

/**
 * Extracts client metadata from a Next.js request.
 * Used for audit logging, login history, and rate limiting.
 */
export function getRequestContextFromRequest(request: NextRequest): RequestContext {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;

  const userAgent = request.headers.get("user-agent");
  const deviceFingerprint = request.headers.get("x-device-fingerprint");

  return {
    ipAddress,
    userAgent,
    deviceFingerprint,
  };
}

/**
 * Server component / route handler variant using next/headers.
 */
export async function getRequestContext(): Promise<RequestContext> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip") ?? null;

  return {
    ipAddress,
    userAgent: headerStore.get("user-agent"),
    deviceFingerprint: headerStore.get("x-device-fingerprint"),
  };
}

/**
 * Derives a simple device label from user-agent for session tracking.
 */
export function deriveDeviceLabel(userAgent: string | null): string | null {
  if (!userAgent) return null;
  if (/mobile|android|iphone|ipad/i.test(userAgent)) return "mobile";
  if (/tablet/i.test(userAgent)) return "tablet";
  return "desktop";
}
