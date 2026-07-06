import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_LOGIN_ROUTE,
  AUTH_ROUTES,
  DASHBOARD_PREFIX,
} from "@/lib/auth/constants";
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

  if (isAuthApiRoute(pathname) || isPublicAuthRoute(pathname)) {
    return baseResponse;
  }

  if (user) {
    if (isGuestOnlyRoute(pathname) || isAdminLoginRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = isAdminRoute(pathname) ? "/admin" : DASHBOARD_PREFIX;
      return NextResponse.redirect(url);
    }

    if (isDashboardRoute(pathname) && !user.emailConfirmed) {
      if (pathname !== AUTH_ROUTES.verifyEmail && pathname !== AUTH_ROUTES.checkEmail) {
        const url = request.nextUrl.clone();
        url.pathname = AUTH_ROUTES.verifyEmail;
        return NextResponse.redirect(url);
      }
    }
  } else {
    if (isDashboardRoute(pathname) || isAdminRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = isAdminRoute(pathname) ? ADMIN_LOGIN_ROUTE : AUTH_ROUTES.login;
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return baseResponse;
}
