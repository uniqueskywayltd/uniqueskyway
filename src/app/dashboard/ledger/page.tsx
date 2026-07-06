import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCustomerProfile, getSessionUser } from "@/lib/auth/session";
import { walletService } from "@/lib/services/wallet.service";
import type { LedgerEntryType } from "@/types/domain";
import { PageHeader } from "@/components/design-system/page-header";
import { EmptyState } from "@/components/design-system/empty-state";
import { LedgerTable } from "@/components/dashboard/ledger-table";
import { LedgerFilters } from "@/components/dashboard/ledger-filters";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";
import { ScrollText } from "lucide-react";

type SearchParams = Promise<{
  page?: string;
  search?: string;
  referenceId?: string;
  entryType?: string;
  direction?: string;
  status?: string;
  from?: string;
  to?: string;
}>;

async function LedgerContent({
  profileId,
  searchParams,
}: {
  profileId: string;
  searchParams: Awaited<SearchParams>;
}) {
  const page = Number(searchParams.page ?? 1);
  const result = await walletService.getLedgerHistory(profileId, {
    page,
    pageSize: 20,
    search: searchParams.search,
    referenceId: searchParams.referenceId,
    entryType: searchParams.entryType as LedgerEntryType | undefined,
    direction: searchParams.direction as "credit" | "debit" | undefined,
    status: (searchParams.status as "completed" | "pending") || undefined,
    from: searchParams.from ? new Date(searchParams.from) : undefined,
    to: searchParams.to ? new Date(searchParams.to) : undefined,
  });

  if (!result.success) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ledger explorer" description="Immutable transaction history for your account." />
        <ServiceErrorState code={result.error.code} message={result.error.message} />
      </div>
    );
  }

  const data = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledger explorer"
        description="Immutable transaction history for your account."
      />

      <Suspense fallback={<div className="h-20 animate-pulse rounded-xl bg-muted" />}>
        <LedgerFilters />
      </Suspense>

      {data.items.length ? (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
          <LedgerTable
            entries={data.items}
            showPagination
            page={data.page}
            totalPages={data.totalPages}
          />
        </Suspense>
      ) : (
        <EmptyState
          title="No transactions found"
          description="Try adjusting your filters or make your first deposit."
          icon={<ScrollText className="h-5 w-5" />}
        />
      )}
    </div>
  );
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getCustomerProfile(user.authUserId);
  if (!profile) redirect("/login");

  const params = await searchParams;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <LedgerContent profileId={profile.id} searchParams={params} />
    </Suspense>
  );
}
