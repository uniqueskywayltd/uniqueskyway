import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { settingsService } from "@/lib/services/settings.service";
import { AdminSettingsManager } from "@/components/admin/admin-settings-manager";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const result = await settingsService.listAll();

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Platform configuration console</p>
      </div>
      <AdminSettingsManager settings={result.data} />
    </div>
  );
}
