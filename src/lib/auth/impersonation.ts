import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const IMPERSONATE_PROFILE_COOKIE = "usw_impersonate_profile";
export const STAFF_SESSION_COOKIE = "usw_staff";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function getImpersonateProfileIdFromRequest(request: NextRequest): string | null {
  return request.cookies.get(IMPERSONATE_PROFILE_COOKIE)?.value ?? null;
}

export async function getImpersonateProfileId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(IMPERSONATE_PROFILE_COOKIE)?.value ?? null;
}

export async function setImpersonation(profileId: string): Promise<void> {
  const jar = await cookies();
  jar.set(IMPERSONATE_PROFILE_COOKIE, profileId, {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 4,
  });
}

export async function clearImpersonation(): Promise<void> {
  const jar = await cookies();
  jar.delete(IMPERSONATE_PROFILE_COOKIE);
}

export async function setStaffSession(): Promise<void> {
  const jar = await cookies();
  jar.set(STAFF_SESSION_COOKIE, "1", {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearStaffSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(STAFF_SESSION_COOKIE);
}

export function isStaffSession(request: NextRequest): boolean {
  return request.cookies.get(STAFF_SESSION_COOKIE)?.value === "1";
}
