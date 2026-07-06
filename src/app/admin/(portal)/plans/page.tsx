import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { investmentPlanService } from "@/lib/services/investment-plan.service";
import { AdminPlansManager } from "@/components/admin/admin-plans-manager";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminPlansPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/admin/login");

  const result = await investmentPlanService.listAllAdmin();

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Investment Plan Management</h1>
        <p className="text-slate-400">
          Plan changes apply to new investments only — existing positions are unaffected.
        </p>
      </div>
      <AdminPlansManager plans={result.data} />
    </div>
  );
}
