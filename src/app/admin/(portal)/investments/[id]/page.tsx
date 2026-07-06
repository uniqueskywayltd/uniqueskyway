import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { investmentAdminService } from "@/lib/services/investment-admin.service";
import { AdminInvestmentDetail } from "@/components/admin/admin-investment-detail";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminInvestmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const result = await investmentAdminService.getDetail(id);

  if (!result.success) {
    return (
      <ServiceErrorState code={result.error.code} message={result.error.message} />
    );
  }

  return <AdminInvestmentDetail investment={result.data} />;
}
