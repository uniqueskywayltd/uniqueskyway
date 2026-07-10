import { NextResponse, type NextRequest } from "next/server";
import { updateSession, applyAuthRouting } from "@/lib/supabase/middleware";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_QUERY_PARAM,
  isAccessGateRequired,
  isBlockedCrawler,
  isGateExemptPath,
  isPublicPreviewPath,
  isSocialPreviewBot,
  isValidAccessToken,
  hasValidAccessCookie,
  PRIVACY_HEADERS,
} from "@/lib/security/privacy-shield";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function applyPrivacyHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(PRIVACY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function accessGateResponse(): NextResponse {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Access Required</title></head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#0f172a"><h1>Access required</h1><p>Unique Sky Way is currently available by invitation only. Use the private access link provided by your administrator.</p><p style="color:#64748b;font-size:0.875rem">If you have an access link, open it in this browser to continue.</p></body></html>`;
  return new NextResponse(html, {
    status: 403,
    headers: { "Content-Type": "text/html; charset=utf-8", ...PRIVACY_HEADERS },
  });
}

function forbiddenCrawlerResponse(): NextResponse {
  return new NextResponse("Forbidden", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...PRIVACY_HEADERS },
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent");
  const host = request.headers.get("host");
  const exempt = isGateExemptPath(pathname);

  if (!exempt && isBlockedCrawler(userAgent)) {
    return forbiddenCrawlerResponse();
  }

  const socialPreview =
    isSocialPreviewBot(userAgent) && isPublicPreviewPath(pathname);

  if (!exempt && isAccessGateRequired(host) && !socialPreview) {
    const accessParam = request.nextUrl.searchParams.get(ACCESS_QUERY_PARAM);
    const accessCookie = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

    if (accessParam && isValidAccessToken(accessParam)) {
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.searchParams.delete(ACCESS_QUERY_PARAM);
      const response = NextResponse.redirect(cleanUrl);
      response.cookies.set(ACCESS_COOKIE_NAME, accessParam, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
      return applyPrivacyHeaders(response);
    }

    if (!hasValidAccessCookie(accessCookie)) {
      return accessGateResponse();
    }
  }

  const { response, user } = await updateSession(request);
  const routed = applyAuthRouting(request, response, user);
  return applyPrivacyHeaders(routed);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
