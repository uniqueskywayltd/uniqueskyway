import { redirect } from "next/navigation";
import { getCustomerProfile, getSessionUser } from "@/lib/auth/session";
import { investmentPlanService } from "@/lib/services/investment-plan.service";
import { walletService } from "@/lib/services/wallet.service";
import { PageHeader } from "@/components/design-system/page-header";
import { ReinvestForm } from "@/components/dashboard/reinvest-form";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function ReinvestPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getCustomerProfile(user.authUserId);
  if (!profile) redirect("/login");

  const { from: parentInvestmentId } = await searchParams;

  const [plansResult, balanceResult] = await Promise.all([
    investmentPlanService.listActive(),
    walletService.getAvailableBalance(profile.id),
  ]);

  if (!plansResult.success) {
    return (
      <div className="max-w-2xl space-y-6">
        <PageHeader title="Reinvest" description="Reinvest your available balance into a new plan." />
        <ServiceErrorState code={plansResult.error.code} message={plansResult.error.message} />
      </div>
    );
  }

  const availableBalance = balanceResult.success ? balanceResult.data : "0.00";

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Reinvest"
        description="Select an eligible balance and plan to create a new investment position."
      />
      <ReinvestForm
        plans={plansResult.data}
        availableBalance={availableBalance}
        parentInvestmentId={parentInvestmentId}
      />
    </div>
  );
}
