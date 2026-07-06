import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCustomerProfile, getSessionUser } from "@/lib/auth/session";
import { walletService } from "@/lib/services/wallet.service";
import { EmptyState, PageHeader, SectionHeading, StatCard } from "@/components/design-system";
import { LedgerTable } from "@/components/dashboard/ledger-table";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";
import { formatMoney } from "@/lib/utils/money";
import { ArrowDownLeft, ArrowUpRight, Clock, Download, Lock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

async function WalletContent({ profileId }: { profileId: string }) {
  const [summaryResult, historyResult] = await Promise.all([
    walletService.getWalletSummary(profileId),
    walletService.getLedgerHistory(profileId, { page: 1, pageSize: 10 }),
  ]);

  if (!summaryResult.success) {
    return (
      <div className="space-y-8">
        <PageHeader title="Wallet" description="All balances are derived from your immutable ledger." />
        <ServiceErrorState code={summaryResult.error.code} message={summaryResult.error.message} />
      </div>
    );
  }

  const summary = summaryResult.data;
  const history = historyResult.success ? historyResult.data : null;
  const currency = summary.currency;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Wallet"
        description="All balances are derived from your immutable ledger."
        actions={
          <Button variant="outline" size="sm" disabled aria-label="Export ledger">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Available balance" value={formatMoney(summary.availableBalance, currency)} icon={<Wallet />} />
        <StatCard title="Withdrawable balance" value={formatMoney(summary.withdrawableBalance, currency)} />
        <StatCard title="Reserved balance" value={formatMoney(summary.reservedBalance, currency)} icon={<Clock />} />
        <StatCard title="Pending balance" value={formatMoney(summary.pendingBalance, currency)} icon={<Clock />} />
        <StatCard title="Locked balance" value={formatMoney(summary.lockedBalance, currency)} icon={<Lock />} />
        <StatCard title="Total credits" value={formatMoney(summary.totalCredits, currency)} />
        <StatCard title="Total debits" value={formatMoney(summary.totalDebits, currency)} />
        <StatCard title="Total deposits" value={formatMoney(summary.totalDeposits, currency)} icon={<ArrowDownLeft />} />
        <StatCard title="Total withdrawals" value={formatMoney(summary.totalWithdrawals, currency)} icon={<ArrowUpRight />} />
      </div>

      <section>
        <SectionHeading title="Ledger history" />
        {history?.items.length ? (
          <LedgerTable entries={history.items} />
        ) : (
          <EmptyState
            title="No transactions"
            description="Your ledger history will appear here once you make deposits or investments."
          />
        )}
      </section>
    </div>
  );
}

export default async function WalletPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getCustomerProfile(user.authUserId);
  if (!profile) redirect("/login");

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <WalletContent profileId={profile.id} />
    </Suspense>
  );
}
