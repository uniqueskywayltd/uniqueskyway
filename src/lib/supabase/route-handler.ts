import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

type RouteHandlerSupabase = {
  supabase: SupabaseClient;
  /** Attach auth cookies collected during sign-in to the final JSON response. */
  withAuthCookies: <T extends NextResponse>(response: T) => T;
};

/**
 * Supabase client for Route Handlers — ensures Set-Cookie headers are copied
 * onto the response we actually return (NextResponse.json), not a throwaway one.
 */
export function createRouteHandlerSupabase(
  request: NextRequest,
): RouteHandlerSupabase {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  let cookieCarrier = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          cookieCarrier = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieCarrier.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return {
    supabase,
    withAuthCookies(response) {
      for (const cookie of cookieCarrier.cookies.getAll()) {
        response.cookies.set(cookie.name, cookie.value, cookie);
      }
      return response;
    },
  };
}
