import { type NextRequest } from "next/server";
import {
  getActorFromRequest,
  jsonError,
  jsonSuccess,
} from "@/lib/api/auth-route";
import { requireAdmin } from "@/lib/auth/api-guard";
import { setImpersonation, clearImpersonation } from "@/lib/auth/impersonation";
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

  await setImpersonation(profile.id);

  const actor = getActorFromRequest(request);
  await auditService.log({
    action: "update",
    entityType: "profile",
    entityId: profile.id,
    actor: { adminUserId: auth.ctx.adminId, ...actor },
    metadata: { impersonate: "start", customerEmail: profile.email },
  });

  return jsonSuccess({ redirectTo: "/dashboard" });
}

export async function DELETE() {
  const auth = await requireAdmin(PERMISSIONS.USERS_READ);
  if (!auth.ok) return auth.response;

  await clearImpersonation();

  await auditService.log({
    action: "update",
    entityType: "admin_user",
    entityId: auth.ctx.adminId,
    actor: { adminUserId: auth.ctx.adminId },
    metadata: { impersonate: "end" },
  });

  return jsonSuccess({ redirectTo: "/hard/auth" });
}
