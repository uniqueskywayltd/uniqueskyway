import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { featureFlagService } from "@/lib/services/feature-flags.service";
import { AdminFeatureFlagsManager } from "@/components/admin/admin-feature-flags-manager";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminFeatureFlagsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const result = await featureFlagService.getAll();

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Feature Flags</h1>
        <p className="text-muted-foreground">Runtime toggles — every change is audited</p>
      </div>
      <AdminFeatureFlagsManager flags={result.data} />
    </div>
  );
}
