import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { withdrawalService } from "@/lib/services/withdrawal.service";
import { AdminWithdrawalDetail } from "@/components/admin/admin-withdrawal-detail";

export default async function AdminWithdrawalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const { id } = await params;
  const result = await withdrawalService.getReviewContext(id);

  if (!result.success) {
    return <div className="text-muted-foreground">Withdrawal not found or unavailable.</div>;
  }

  return <AdminWithdrawalDetail withdrawal={result.data} />;
}
