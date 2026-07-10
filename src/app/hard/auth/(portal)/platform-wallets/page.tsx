import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { platformWalletService } from "@/lib/services/platform-wallet.service";
import { AdminPlatformWalletsManager } from "@/components/admin/admin-platform-wallets-manager";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminPlatformWalletsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const result = await platformWalletService.listAllAdmin();

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform Wallets</h1>
        <p className="text-muted-foreground">
          Configure company-owned deposit wallets for customer payments. Changes do not affect
          historical deposits.
        </p>
      </div>
      <AdminPlatformWalletsManager wallets={result.data} />
    </div>
  );
}
