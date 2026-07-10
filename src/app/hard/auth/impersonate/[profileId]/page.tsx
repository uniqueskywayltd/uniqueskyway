import { redirect } from "next/navigation";
import { getAdminProfile, getCustomerProfileById, getSessionUser } from "@/lib/auth/session";
import { buildImpersonationDashboardPath, isValidImpersonateProfileId } from "@/lib/auth/impersonation";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { auditService } from "@/lib/services/audit.service";
import { permissionService } from "@/lib/services/permissions.service";

type PageProps = {
  params: Promise<{ profileId: string }>;
};

export default async function ImpersonateStartPage({ params }: PageProps) {
  const { profileId } = await params;

  if (!isValidImpersonateProfileId(profileId)) {
    redirect("/hard/auth/customers");
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(`/hard/auth/login?next=${encodeURIComponent(`/hard/auth/impersonate/${profileId}`)}`);
  }

  const perm = await permissionService.requirePermission(user.authUserId, PERMISSIONS.USERS_READ);
  if (!perm.success) {
    redirect("/hard/auth/login");
  }

  const admin = await getAdminProfile(user.authUserId);
  if (!admin) {
    redirect("/hard/auth/login");
  }

  const profile = await getCustomerProfileById(profileId);
  if (!profile) {
    redirect("/hard/auth/customers");
  }

  try {
    await auditService.log({
      action: "update",
      entityType: "profile",
      entityId: profile.id,
      actor: { adminUserId: admin.id },
      metadata: { impersonate: "start", customerEmail: profile.email },
    });
  } catch {
    // Audit failure must not block impersonation bootstrap.
  }

  redirect(buildImpersonationDashboardPath(profile.id));
}
