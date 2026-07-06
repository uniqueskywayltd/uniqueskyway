import { type NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api/auth-route";
import { getCustomerProfile, getSessionUser, signOutAllSessions } from "@/lib/auth/session";
import { sessionService } from "@/lib/services/session.service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Not authenticated", 401);

  const profile = await getCustomerProfile(user.authUserId);
  if (!profile) return jsonError("Profile not found", 404);

  const sessions = await sessionService.listSessions(profile.id);

  return jsonSuccess({
    sessions: sessions.map((s) => ({
      id: s.id,
      browser: s.browser ?? "Unknown",
      os: s.os ?? "Unknown",
      deviceLabel: s.deviceLabel,
      ipAddress: s.ipAddress,
      lastActiveAt: s.lastActiveAt,
      isCurrent: s.isCurrent,
      createdAt: s.createdAt,
    })),
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return jsonError("Not authenticated", 401);

  const profile = await getCustomerProfile(user.authUserId);
  if (!profile) return jsonError("Profile not found", 404);

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");
  const all = searchParams.get("all") === "true";

  if (all) {
    await signOutAllSessions(user.authUserId);
    return jsonSuccess({ success: true });
  }

  if (!sessionId) {
    return jsonError("Session id required");
  }

  await sessionService.revokeSession(sessionId);

  const supabase = await createClient();
  await supabase.auth.signOut();

  return jsonSuccess({ redirectTo: "/login" });
}
