import { redirect } from "next/navigation";
import { getCustomerProfile, getSessionUser } from "@/lib/auth/session";
import { investmentPlanService } from "@/lib/services/investment-plan.service";
import { paymentMethodService } from "@/lib/services/payment-method.service";
import { PageHeader } from "@/components/design-system/page-header";
import { DepositForm } from "@/components/dashboard/deposit-form";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";
import { isStorageConfigured } from "@/lib/env";

export default async function NewDepositPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getCustomerProfile(user.authUserId);
  if (!profile) redirect("/login");

  const [plansResult, methodsResult] = await Promise.all([
    investmentPlanService.listActive(),
    paymentMethodService.listActive(),
  ]);

  if (!plansResult.success) {
    return (
      <div className="max-w-2xl space-y-6">
        <PageHeader title="New deposit" description="Submit a deposit to fund your investment." />
        <ServiceErrorState code={plansResult.error.code} message={plansResult.error.message} />
      </div>
    );
  }

  if (!methodsResult.success) {
    return (
      <div className="max-w-2xl space-y-6">
        <PageHeader title="New deposit" description="Submit a deposit to fund your investment." />
        <ServiceErrorState code={methodsResult.error.code} message={methodsResult.error.message} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="New deposit"
        description="Select a plan, choose your payment method, and submit for review."
      />
      <DepositForm
        plans={plansResult.data}
        paymentMethods={methodsResult.data}
        storageAvailable={isStorageConfigured()}
      />
    </div>
  );
}
