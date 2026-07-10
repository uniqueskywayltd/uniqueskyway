import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/auth/session";
import { getCustomerDepositAvailability } from "@/lib/services/deposit-availability.service";
import { PageHeader } from "@/components/design-system/page-header";
import { DepositForm } from "@/components/dashboard/deposit-form";
import { DepositUnavailableState } from "@/components/dashboard/deposit-unavailable-state";
import { isStorageConfigured } from "@/lib/env";

export default async function NewDepositPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  const { profile } = session;

  const availabilityResult = await getCustomerDepositAvailability();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="New deposit" description="Submit a deposit to fund your investment." />

      {!availabilityResult.success ? (
        <DepositUnavailableState
          reason="infrastructure"
          title="Deposits unavailable"
          message={availabilityResult.error.message}
        />
      ) : !availabilityResult.data.canDeposit ? (
        <DepositUnavailableState
          reason={availabilityResult.data.reason}
          title={availabilityResult.data.title}
          message={availabilityResult.data.message}
        />
      ) : (
        <DepositForm
          plans={availabilityResult.data.plans}
          platformWallets={availabilityResult.data.wallets}
          storageAvailable={isStorageConfigured()}
        />
      )}
    </div>
  );
}
