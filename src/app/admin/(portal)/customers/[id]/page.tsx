import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { customerAdminService } from "@/lib/services/customer-admin.service";
import { AdminCustomerDetail } from "@/components/admin/admin-customer-detail";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const result = await customerAdminService.getDetail(id);

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  return <AdminCustomerDetail customer={result.data} />;
}
