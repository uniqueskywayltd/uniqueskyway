import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { investmentPlanService } from "@/lib/services/investment-plan.service";
import { AdminPageHeader } from "@/components/design-system";
import { AdminPlansManager } from "@/components/admin/admin-plans-manager";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminPlansPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const result = await investmentPlanService.listAllAdmin();

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Investment plan management"
        description="Edit active plans, add new tiers, and control what appears on the homepage and deposit flow."
      />
      <AdminPlansManager plans={result.data} />
    </div>
  );
}
