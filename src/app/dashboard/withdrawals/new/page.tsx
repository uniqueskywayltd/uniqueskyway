import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/auth/session";
import { withdrawalMethodService } from "@/lib/services/withdrawal-method.service";
import { walletService } from "@/lib/services/wallet.service";
import { PageHeader } from "@/components/design-system/page-header";
import { WithdrawalForm } from "@/components/dashboard/withdrawal-form";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function NewWithdrawalPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  const { profile } = session;

  const [methodsResult, balanceResult] = await Promise.all([
    withdrawalMethodService.listActive(),
    walletService.getWithdrawableBalance(profile.id),
  ]);

  if (!methodsResult.success) {
    return (
      <div className="max-w-3xl space-y-6">
        <PageHeader title="New withdrawal" description="Request a withdrawal from your available balance." />
        <ServiceErrorState code={methodsResult.error.code} message={methodsResult.error.message} />
      </div>
    );
  }

  const withdrawableBalance = balanceResult.success ? balanceResult.data : "0.00";

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="New withdrawal"
        description="Select a method, enter your destination, and submit for review."
      />
      <WithdrawalForm methods={methodsResult.data} withdrawableBalance={withdrawableBalance} />
    </div>
  );
}
