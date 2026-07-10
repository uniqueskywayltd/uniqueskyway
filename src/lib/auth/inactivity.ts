import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

export const LAST_ACTIVE_COOKIE = "usw_last_active";
export const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: INACTIVITY_TIMEOUT_MS / 1000,
};

export function isSessionInactive(request: NextRequest): boolean {
  const raw = request.cookies.get(LAST_ACTIVE_COOKIE)?.value;
  if (!raw) return false;

  const lastActive = Number(raw);
  if (!Number.isFinite(lastActive) || lastActive <= 0) return false;

  return Date.now() - lastActive > INACTIVITY_TIMEOUT_MS;
}

export function touchLastActive(response: NextResponse): NextResponse {
  response.cookies.set(LAST_ACTIVE_COOKIE, String(Date.now()), COOKIE_OPTIONS);
  return response;
}

export function clearLastActiveCookie(response: NextResponse): NextResponse {
  response.cookies.set(LAST_ACTIVE_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
