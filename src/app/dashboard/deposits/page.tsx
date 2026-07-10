import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/auth/session";
import { depositService } from "@/lib/services/deposit.service";
import { PageHeader } from "@/components/design-system/page-header";
import { DepositsTable } from "@/components/dashboard/deposits-table";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";
import { buttonVariants } from "@/components/ui/button";
import type { DepositStatus } from "@/types/domain";

type SearchParams = Promise<{ page?: string; status?: string }>;

async function DepositsContent({ profileId, searchParams }: { profileId: string; searchParams: Awaited<SearchParams> }) {
  const page = Number(searchParams.page ?? 1);
  const result = await depositService.listForProfile(profileId, {
    page,
    pageSize: 20,
    status: searchParams.status as DepositStatus | undefined,
  });

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  return (
    <DepositsTable items={result.data.items} page={result.data.page} totalPages={result.data.totalPages} />
  );
}

export default async function DepositsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  const { profile } = session;

  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deposits"
        description="Track your deposit requests and investment funding history."
        actions={
          <Link href="/dashboard/deposits/new" className={buttonVariants()}>
            New deposit
          </Link>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DepositsContent profileId={profile.id} searchParams={params} />
      </Suspense>
    </div>
  );
}
