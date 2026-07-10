import { cookies } from "next/headers";

import type { NextRequest } from "next/server";

import type { NextResponse } from "next/server";



export const IMPERSONATE_PROFILE_COOKIE = "usw_impersonate_profile";

export const IMPERSONATE_RETURN_COOKIE = "usw_impersonate_return";

export const IMPERSONATE_QUERY_PARAM = "impersonate_as";

export const STAFF_SESSION_COOKIE = "usw_staff";



/** 7 days — refreshed on each dashboard request while impersonating */

export const IMPERSONATION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;



const UUID_RE =

  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;



export function isValidImpersonateProfileId(value: string | null | undefined): value is string {

  return Boolean(value && UUID_RE.test(value));

}



export function buildImpersonationCookieOptions(maxAge = IMPERSONATION_COOKIE_MAX_AGE) {

  return {

    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: "lax" as const,

    path: "/",

    maxAge,

  };

}



export function applyImpersonationCookies(

  response: NextResponse,

  profileId: string,

  returnPath?: string,

): NextResponse {

  const opts = buildImpersonationCookieOptions();

  response.cookies.set(IMPERSONATE_PROFILE_COOKIE, profileId, opts);

  response.cookies.set(

    IMPERSONATE_RETURN_COOKIE,

    returnPath ?? `/hard/auth/customers/${profileId}`,

    opts,

  );

  return response;

}



export function applyStaffSessionCookie(response: NextResponse): NextResponse {

  response.cookies.set(

    STAFF_SESSION_COOKIE,

    "1",

    buildImpersonationCookieOptions(60 * 60 * 24 * 7),

  );

  return response;

}



export function applyImpersonationSession(

  response: NextResponse,

  profileId: string,

  returnPath?: string,

): NextResponse {

  applyStaffSessionCookie(response);

  return applyImpersonationCookies(response, profileId, returnPath);

}



export function clearImpersonationCookiesOnResponse(response: NextResponse): NextResponse {

  const cleared = buildImpersonationCookieOptions(0);

  response.cookies.set(IMPERSONATE_PROFILE_COOKIE, "", cleared);

  response.cookies.set(IMPERSONATE_RETURN_COOKIE, "", cleared);

  return response;

}



export async function setImpersonationCookies(

  profileId: string,

  returnPath?: string,

): Promise<void> {

  const jar = await cookies();

  const opts = buildImpersonationCookieOptions();

  jar.set(IMPERSONATE_PROFILE_COOKIE, profileId, opts);

  jar.set(

    IMPERSONATE_RETURN_COOKIE,

    returnPath ?? `/hard/auth/customers/${profileId}`,

    opts,

  );

}



export function getPersistedImpersonateProfileId(request: NextRequest): string | null {

  const cookieValue = request.cookies.get(IMPERSONATE_PROFILE_COOKIE)?.value;

  return isValidImpersonateProfileId(cookieValue) ? cookieValue : null;

}



export function getImpersonateProfileIdFromRequest(request: NextRequest): string | null {

  const persisted = getPersistedImpersonateProfileId(request);

  if (persisted) return persisted;



  if (!isStaffSession(request)) {

    return null;

  }



  const queryValue = request.nextUrl.searchParams.get(IMPERSONATE_QUERY_PARAM);

  if (isValidImpersonateProfileId(queryValue)) {

    return queryValue;

  }



  return null;

}



export function getImpersonateBootstrapQueryId(request: NextRequest): string | null {

  if (!isStaffSession(request)) return null;

  const queryValue = request.nextUrl.searchParams.get(IMPERSONATE_QUERY_PARAM);

  return isValidImpersonateProfileId(queryValue) ? queryValue : null;

}



export async function getImpersonateProfileId(): Promise<string | null> {

  const jar = await cookies();

  const value = jar.get(IMPERSONATE_PROFILE_COOKIE)?.value;

  return isValidImpersonateProfileId(value) ? value : null;

}



export async function setImpersonation(profileId: string): Promise<void> {

  await setImpersonationCookies(profileId);

}



export async function clearImpersonation(): Promise<void> {

  const jar = await cookies();

  jar.delete(IMPERSONATE_PROFILE_COOKIE);

  jar.delete(IMPERSONATE_RETURN_COOKIE);

}



export async function setStaffSession(): Promise<void> {

  const jar = await cookies();

  jar.set(STAFF_SESSION_COOKIE, "1", buildImpersonationCookieOptions(60 * 60 * 24 * 7));

}



export async function clearStaffSession(): Promise<void> {

  const jar = await cookies();

  jar.delete(STAFF_SESSION_COOKIE);

}



export function isStaffSession(request: NextRequest): boolean {

  if (request.cookies.get(STAFF_SESSION_COOKIE)?.value === "1") {

    return true;

  }



  // Active impersonation always implies an authenticated staff session.

  return Boolean(getPersistedImpersonateProfileId(request));

}



export function buildImpersonationDashboardPath(profileId: string): string {

  return `/dashboard?${IMPERSONATE_QUERY_PARAM}=${encodeURIComponent(profileId)}`;

}



export function hasInvalidImpersonationCookie(request: NextRequest): boolean {

  const raw = request.cookies.get(IMPERSONATE_PROFILE_COOKIE)?.value;

  return Boolean(raw && !isValidImpersonateProfileId(raw));

}


