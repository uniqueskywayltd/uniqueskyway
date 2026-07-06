import { type NextRequest } from "next/server";
import { getActorFromRequest, jsonSuccess } from "@/lib/api/auth-route";
import { authService } from "@/lib/services/auth.service";

export async function POST(request: NextRequest) {
  await authService.logout(getActorFromRequest(request));
  return jsonSuccess({ redirectTo: "/login" });
}
