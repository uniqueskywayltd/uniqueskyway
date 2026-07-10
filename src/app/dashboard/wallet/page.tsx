import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/auth/session";
import { walletService } from "@/lib/services/wallet.service";
import { EmptyState, PageHeader, SectionHeading, StatCard } from "@/components/design-system";
import { LedgerTable } from "@/components/dashboard/ledger-table";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";
import { formatMoney } from "@/lib/utils/money";
import { ArrowDownLeft, ArrowUpRight, Clock, Download, Lock, PiggyBank, ScrollText, Wallet } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

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
        <StatCard
          title="Available balance"
          value={formatMoney(summary.availableBalance, currency)}
          icon={<Wallet />}
          href="/dashboard/withdrawals/new"
          actionLabel="Withdraw funds"
          accent="emerald"
        />
        <StatCard
          title="Withdrawable balance"
          value={formatMoney(summary.withdrawableBalance, currency)}
          icon={<PiggyBank />}
          href="/dashboard/withdrawals/new"
          actionLabel="New withdrawal"
          accent="sky"
        />
        <StatCard
          title="Reserved balance"
          value={formatMoney(summary.reservedBalance, currency)}
          icon={<Clock />}
          href="/dashboard/portfolio"
          actionLabel="View portfolio"
          accent="amber"
        />
        <StatCard
          title="Pending balance"
          value={formatMoney(summary.pendingBalance, currency)}
          icon={<Clock />}
          href="/dashboard/deposits"
          actionLabel="View deposits"
          accent="sky"
        />
        <StatCard
          title="Locked balance"
          value={formatMoney(summary.lockedBalance, currency)}
          icon={<Lock />}
          href="/dashboard/portfolio"
          actionLabel="View investments"
          accent="violet"
        />
        <StatCard
          title="Total credits"
          value={formatMoney(summary.totalCredits, currency)}
          icon={<ArrowDownLeft />}
          href="/dashboard/ledger?direction=credit"
          actionLabel="Credit ledger"
          accent="emerald"
        />
        <StatCard
          title="Total debits"
          value={formatMoney(summary.totalDebits, currency)}
          icon={<ArrowUpRight />}
          href="/dashboard/ledger?direction=debit"
          actionLabel="Debit ledger"
          accent="rose"
        />
        <StatCard
          title="Total deposits"
          value={formatMoney(summary.totalDeposits, currency)}
          icon={<ArrowDownLeft />}
          href="/dashboard/deposits"
          actionLabel="Deposit history"
          accent="sky"
        />
        <StatCard
          title="Total withdrawals"
          value={formatMoney(summary.totalWithdrawals, currency)}
          icon={<ArrowUpRight />}
          href="/dashboard/withdrawals"
          actionLabel="Withdrawal history"
          accent="rose"
        />
      </div>

      <section>
        <SectionHeading
          title="Ledger history"
          actions={
            <Link href="/dashboard/ledger" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View full ledger
            </Link>
          }
        />
        {history?.items.length ? (
          <LedgerTable entries={history.items} />
        ) : (
          <EmptyState
            title="No ledger entries yet"
            description="Credits and debits from deposits, investments, and earnings appear here."
            icon={<ScrollText className="h-5 w-5" />}
          />
        )}
      </section>
    </div>
  );
}

export default async function WalletPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  const { profile } = session;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <WalletContent profileId={profile.id} />
    </Suspense>
  );
}
