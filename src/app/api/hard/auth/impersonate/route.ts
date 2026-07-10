import { NextResponse, type NextRequest } from "next/server";
import {
  getActorFromRequest,
  jsonError,
} from "@/lib/api/auth-route";
import { requireAdmin } from "@/lib/auth/api-guard";
import {
  IMPERSONATE_PROFILE_COOKIE,
  IMPERSONATE_RETURN_COOKIE,
  IMPERSONATE_QUERY_PARAM,
  buildImpersonationCookieOptions,
  buildImpersonationDashboardPath,
} from "@/lib/auth/impersonation";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { auditService } from "@/lib/services/audit.service";
import { getCustomerProfileById } from "@/lib/auth/session";
import { z } from "zod";

const bodySchema = z.object({
  profileId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.USERS_READ);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request");
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid profile");
  }

  const profile = await getCustomerProfileById(parsed.data.profileId);
  if (!profile) {
    return jsonError("Customer not found", 404);
  }

  const actor = getActorFromRequest(request);
  await auditService.log({
    action: "update",
    entityType: "profile",
    entityId: profile.id,
    actor: { adminUserId: auth.ctx.adminId, ...actor },
    metadata: { impersonate: "start", customerEmail: profile.email },
  });

  return NextResponse.json({
    redirectTo: buildImpersonationDashboardPath(profile.id),
    openInNewTab: true,
  });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.USERS_READ);
  if (!auth.ok) return auth.response;

  const returnTo =
    request.cookies.get(IMPERSONATE_RETURN_COOKIE)?.value ?? "/hard/auth/customers";

  await auditService.log({
    action: "update",
    entityType: "admin_user",
    entityId: auth.ctx.adminId,
    actor: { adminUserId: auth.ctx.adminId },
    metadata: { impersonate: "end" },
  });

  const cleared = buildImpersonationCookieOptions(0);
  const response = NextResponse.json({ redirectTo: returnTo });
  response.cookies.set(IMPERSONATE_PROFILE_COOKIE, "", cleared);
  response.cookies.set(IMPERSONATE_RETURN_COOKIE, "", cleared);
  return response;
}
