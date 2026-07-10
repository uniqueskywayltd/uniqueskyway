import { NextResponse, type NextRequest } from "next/server";
import { getActorFromRequest } from "@/lib/api/auth-route";
import { authService } from "@/lib/services/auth.service";
import { clearLastActiveCookie } from "@/lib/auth/inactivity";

async function logoutAndRedirect(request: NextRequest) {
  await authService.logout(getActorFromRequest(request));
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  clearLastActiveCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  return logoutAndRedirect(request);
}

export async function POST(request: NextRequest) {
  return logoutAndRedirect(request);
}
