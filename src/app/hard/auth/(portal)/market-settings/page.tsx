import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { marketDataService } from "@/lib/services/market-data.service";
import { AdminMarketSettingsManager } from "@/components/admin/admin-market-settings-manager";

export default async function AdminMarketSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const config = await marketDataService.getConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Market Settings</h1>
        <p className="text-muted-foreground">
          Configure the homepage market overview strip — assets, provider, and refresh behaviour
        </p>
      </div>
      <AdminMarketSettingsManager config={config} />
    </div>
  );
}
