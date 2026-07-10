import { createServerClient } from "@supabase/ssr";

import { NextResponse, type NextRequest } from "next/server";

import {

  ADMIN_LOGIN_ROUTE,

  AUTH_ROUTES,

  DASHBOARD_PREFIX,

} from "@/lib/auth/constants";

import {

  IMPERSONATE_QUERY_PARAM,

  applyImpersonationCookies,

  applyStaffSessionCookie,

  clearImpersonationCookiesOnResponse,

  getImpersonateBootstrapQueryId,

  getImpersonateProfileIdFromRequest,

  getPersistedImpersonateProfileId,

  hasInvalidImpersonationCookie,

  isStaffSession,

  isValidImpersonateProfileId,

} from "@/lib/auth/impersonation";

import {

  isSessionInactive,

  touchLastActive,

} from "@/lib/auth/inactivity";

import {

  isAdminLoginRoute,

  isAdminRoute,

  isAuthApiRoute,

  isDashboardRoute,

  isGuestOnlyRoute,

  isMaintenanceExempt,

  isPublicAuthRoute,

} from "@/lib/auth/routes";



export type SessionUpdateResult = {

  response: NextResponse;

  user: { id: string; email?: string; emailConfirmed: boolean } | null;

};



function isInactivityExempt(pathname: string): boolean {

  return (

    pathname === "/api/auth/logout" ||

    pathname === "/api/hard/auth/logout" ||

    pathname === "/login" ||

    pathname === "/hard/auth/login"

  );

}



function finalizeSessionActivity(

  request: NextRequest,

  response: NextResponse,

  user: SessionUpdateResult["user"],

): NextResponse {

  if (!user) return response;

  const { pathname } = request.nextUrl;

  if (isDashboardRoute(pathname) || isAdminRoute(pathname)) {

    return touchLastActive(response);

  }

  return response;

}



function withInvalidCookieCleanup(

  request: NextRequest,

  response: NextResponse,

): NextResponse {

  if (!hasInvalidImpersonationCookie(request)) {

    return response;

  }

  return clearImpersonationCookiesOnResponse(response);

}



export async function updateSession(request: NextRequest): Promise<SessionUpdateResult> {

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;



  if (!url || !key) {

    return { response: NextResponse.next({ request }), user: null };

  }



  let supabaseResponse = NextResponse.next({ request });



  const supabase = createServerClient(url, key, {

    cookies: {

      getAll() {

        return request.cookies.getAll();

      },

      setAll(cookiesToSet) {

        cookiesToSet.forEach(({ name, value }) => {

          request.cookies.set(name, value);

        });

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {

          supabaseResponse.cookies.set(name, value, options);

        });

      },

    },

  });



  const { data } = await supabase.auth.getUser();

  const user = data.user

    ? {

        id: data.user.id,

        email: data.user.email,

        emailConfirmed: Boolean(data.user.email_confirmed_at),

      }

    : null;



  return { response: supabaseResponse, user };

}



export function applyAuthRouting(

  request: NextRequest,

  baseResponse: NextResponse,

  user: SessionUpdateResult["user"],

): NextResponse {

  const { pathname } = request.nextUrl;



  if (process.env.MAINTENANCE_MODE === "true" && !isMaintenanceExempt(pathname)) {

    const url = request.nextUrl.clone();

    url.pathname = AUTH_ROUTES.maintenance;

    return NextResponse.redirect(url);

  }



  if (pathname === "/admin" || pathname.startsWith("/admin/")) {

    const url = request.nextUrl.clone();

    url.pathname = pathname.replace(/^\/admin/, "/hard/auth");

    return NextResponse.redirect(url, 308);

  }



  if (isAuthApiRoute(pathname) || isPublicAuthRoute(pathname)) {

    return baseResponse;

  }



  if (user) {

    const protectedSessionRoute = isDashboardRoute(pathname) || isAdminRoute(pathname);

    if (protectedSessionRoute && !isInactivityExempt(pathname) && isSessionInactive(request)) {

      const url = request.nextUrl.clone();

      url.pathname =

        isAdminRoute(pathname) || isStaffSession(request)

          ? "/api/hard/auth/logout"

          : "/api/auth/logout";

      url.searchParams.set("reason", "inactivity");

      return NextResponse.redirect(url);

    }



    const persistedImpersonateId = getPersistedImpersonateProfileId(request);

    const bootstrapQueryId = getImpersonateBootstrapQueryId(request);

    const pendingBootstrapQuery = isValidImpersonateProfileId(

      request.nextUrl.searchParams.get(IMPERSONATE_QUERY_PARAM),

    );



    // Legacy / fallback bootstrap via query param when cookies are not yet persisted.

    if (

      bootstrapQueryId &&

      isDashboardRoute(pathname) &&

      isStaffSession(request) &&

      !persistedImpersonateId

    ) {

      const cleanUrl = request.nextUrl.clone();

      cleanUrl.searchParams.delete(IMPERSONATE_QUERY_PARAM);

      const response = NextResponse.redirect(cleanUrl);

      applyStaffSessionCookie(response);

      return withInvalidCookieCleanup(

        request,

        applyImpersonationCookies(

          response,

          bootstrapQueryId,

          `/hard/auth/customers/${bootstrapQueryId}`,

        ),

      );

    }



    if (

      isDashboardRoute(pathname) &&

      isStaffSession(request) &&

      persistedImpersonateId &&

      request.nextUrl.searchParams.has(IMPERSONATE_QUERY_PARAM)

    ) {

      const cleanUrl = request.nextUrl.clone();

      cleanUrl.searchParams.delete(IMPERSONATE_QUERY_PARAM);

      return withInvalidCookieCleanup(request, NextResponse.redirect(cleanUrl));

    }



    const impersonateProfileId = getImpersonateProfileIdFromRequest(request);

    const impersonating = Boolean(impersonateProfileId);



    if (

      isDashboardRoute(pathname) &&

      isStaffSession(request) &&

      !impersonating &&

      !pendingBootstrapQuery

    ) {

      const url = request.nextUrl.clone();

      url.pathname = "/hard/auth";

      return withInvalidCookieCleanup(request, NextResponse.redirect(url));

    }



    if (

      impersonating &&

      impersonateProfileId &&

      isDashboardRoute(pathname) &&

      isStaffSession(request)

    ) {

      return finalizeSessionActivity(

        request,

        withInvalidCookieCleanup(

          request,

          applyImpersonationCookies(

            baseResponse,

            impersonateProfileId,

            `/hard/auth/customers/${impersonateProfileId}`,

          ),

        ),

        user,

      );

    }



    if (isGuestOnlyRoute(pathname) || isAdminLoginRoute(pathname)) {

      const pendingVerification =

        pathname === AUTH_ROUTES.register &&

        (request.nextUrl.searchParams.get("verify") === "1" ||

          request.nextUrl.searchParams.get("verified") === "1");

      if (!pendingVerification) {

        const url = request.nextUrl.clone();

        url.pathname =

          isStaffSession(request) || isAdminRoute(pathname) ? "/hard/auth" : DASHBOARD_PREFIX;

        return NextResponse.redirect(url);

      }

    }



    if (isDashboardRoute(pathname) && !user.emailConfirmed && !impersonating) {

      const url = request.nextUrl.clone();

      url.pathname = AUTH_ROUTES.register;

      url.searchParams.set("verify", "1");

      if (user.email) url.searchParams.set("email", user.email);

      return NextResponse.redirect(url);

    }

  } else {

    if (isDashboardRoute(pathname) || isAdminRoute(pathname)) {

      const url = request.nextUrl.clone();

      url.pathname = isAdminRoute(pathname) ? ADMIN_LOGIN_ROUTE : AUTH_ROUTES.login;

      url.searchParams.set("next", pathname);

      return NextResponse.redirect(url);

    }

  }



  return finalizeSessionActivity(

    request,

    withInvalidCookieCleanup(request, baseResponse),

    user,

  );

}


