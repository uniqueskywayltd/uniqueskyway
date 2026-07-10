import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/auth/session";
import { withdrawalService } from "@/lib/services/withdrawal.service";
import { PageHeader } from "@/components/design-system/page-header";
import { WithdrawalsTable } from "@/components/dashboard/withdrawals-table";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";
import { buttonVariants } from "@/components/ui/button";
import type { WithdrawalStatus } from "@/types/domain";

type SearchParams = Promise<{ page?: string; status?: string }>;

async function WithdrawalsContent({
  profileId,
  searchParams,
}: {
  profileId: string;
  searchParams: Awaited<SearchParams>;
}) {
  const page = Number(searchParams.page ?? 1);
  const result = await withdrawalService.listForProfile(profileId, {
    page,
    pageSize: 20,
    status: searchParams.status as WithdrawalStatus | undefined,
  });

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  return (
    <WithdrawalsTable items={result.data.items} page={result.data.page} totalPages={result.data.totalPages} />
  );
}

export default async function WithdrawalsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  const { profile } = session;

  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Withdrawals"
        description="Track withdrawal requests and payout status."
        actions={
          <Link href="/dashboard/withdrawals/new" className={buttonVariants()}>
            New withdrawal
          </Link>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <WithdrawalsContent profileId={profile.id} searchParams={params} />
      </Suspense>
    </div>
  );
}
