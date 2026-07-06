import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { ledgerAdminService } from "@/lib/services/ledger-admin.service";
import { AdminLedgerExplorer } from "@/components/admin/admin-ledger-explorer";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminLedgerPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const result = await ledgerAdminService.listEntries({ page: 1, pageSize: 50 });

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Ledger Explorer</h1>
      <AdminLedgerExplorer initialEntries={result.data.items} />
    </div>
  );
}
