import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { depositService } from "@/lib/services/deposit.service";
import { AdminDepositDetail } from "@/components/admin/admin-deposit-detail";

export default async function AdminDepositDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const { id } = await params;
  const result = await depositService.getByIdForAdmin(id);

  if (!result.success) {
    return (
      <div className="text-muted-foreground">
        Deposit not found or unavailable.
      </div>
    );
  }

  return <AdminDepositDetail deposit={result.data} />;
}
