import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Clock,
  Gift,
  Lock,
  PieChart,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getDashboardSession } from "@/lib/auth/session";
import { dashboardService } from "@/lib/services/dashboard.service";
import { StatCard } from "@/components/design-system/stat-card";
import { DashboardPanelCard } from "@/components/design-system/dashboard-panel-card";
import { DashboardWelcomeHero } from "@/components/dashboard/dashboard-welcome-hero";
import { EmptyState } from "@/components/design-system/empty-state";
import {
  AllocationChart,
  BalanceHistoryChart,
  EarningsTrendChart,
  PortfolioGrowthChart,
} from "@/components/dashboard/dashboard-charts";
import { LedgerTable } from "@/components/dashboard/ledger-table";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";
import { DashboardErrorBoundary } from "@/components/dashboard/dashboard-error-boundary";
import { formatMoney } from "@/lib/utils/money";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function DashboardContent({
  profileId,
  fullName,
  username,
  avatarPath,
}: {
  profileId: string;
  fullName: string;
  username: string;
  avatarPath: string | null;
}) {
  const result = await dashboardService.getDashboardData(profileId);

  if (!result.success) {
    return (
      <div className="space-y-8">
        <DashboardWelcomeHero
          fullName={fullName}
          username={username}
          avatarPath={avatarPath}
        />
        <ServiceErrorState code={result.error.code} message={result.error.message} />
      </div>
    );
  }

  const data = result.data;
  const w = data.portfolio.wallet;
  const currency = w.currency;

  return (
    <div className="space-y-8">
      <DashboardWelcomeHero
        fullName={fullName}
        username={username}
        avatarPath={avatarPath}
      />

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Portfolio & balances
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total portfolio value"
            value={formatMoney(w.totalPortfolioValue, currency)}
            icon={<Wallet />}
            href="/dashboard/portfolio"
            actionLabel="View portfolio"
            accent="violet"
          />
          <StatCard
            title="Available balance"
            value={formatMoney(w.availableBalance, currency)}
            icon={<PiggyBank />}
            href="/dashboard/wallet"
            actionLabel="Open wallet"
            accent="emerald"
          />
          <StatCard
            title="Locked balance"
            value={formatMoney(w.lockedBalance, currency)}
            icon={<Lock />}
            href="/dashboard/portfolio"
            actionLabel="View investments"
            accent="amber"
          />
          <StatCard
            title="Pending balance"
            value={formatMoney(w.pendingBalance, currency)}
            icon={<Clock />}
            href="/dashboard/wallet"
            actionLabel="View pending"
            accent="sky"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Cash flow & earnings
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total deposits"
            value={formatMoney(w.totalDeposits, currency)}
            icon={<ArrowDownLeft />}
            href="/dashboard/deposits"
            actionLabel="View deposits"
            accent="sky"
          />
          <StatCard
            title="Total withdrawals"
            value={formatMoney(w.totalWithdrawals, currency)}
            icon={<ArrowUpRight />}
            href="/dashboard/withdrawals"
            actionLabel="View withdrawals"
            accent="rose"
          />
          <StatCard
            title="Total ROI earned"
            value={formatMoney(w.totalRoiEarned, currency)}
            icon={<TrendingUp />}
            href="/dashboard/portfolio"
            actionLabel="View ROI"
            accent="emerald"
          />
          <StatCard
            title="Referral earnings"
            value={formatMoney(w.referralEarnings, currency)}
            icon={<Gift />}
            href="/dashboard/ledger?entryType=referral_commission"
            actionLabel="View referrals"
            accent="primary"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Investments & queue
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active investments"
            value={String(data.portfolio.activeInvestments)}
            description={`${data.portfolio.totalInvestments} total`}
            icon={<PieChart />}
            href="/dashboard/portfolio"
            actionLabel="Manage portfolio"
            accent="violet"
          />
          <StatCard
            title="Matured investments"
            value={String(data.portfolio.maturedInvestments)}
            icon={<TrendingUp />}
            href="/dashboard/portfolio"
            actionLabel="View matured"
            accent="emerald"
          />
          <StatCard
            title="Pending investments"
            value={String(data.portfolio.pendingInvestments)}
            icon={<Clock />}
            href="/dashboard/portfolio"
            actionLabel="View pending"
            accent="amber"
          />
          <StatCard
            title="Pending transactions"
            value={String(w.pendingTransactionCount)}
            description={`${w.pendingDepositCount} deposits · ${w.pendingWithdrawalCount} withdrawals`}
            icon={<Clock />}
            href="/dashboard/activity"
            actionLabel="View activity"
            accent="slate"
          />
        </div>
      </section>

      <DashboardErrorBoundary fallbackTitle="Charts failed to load">
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Performance charts
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <PortfolioGrowthChart
              data={data.charts.portfolioGrowth}
              href="/dashboard/portfolio"
              viewLabel="Open portfolio"
            />
            <BalanceHistoryChart
              data={data.charts.balanceHistory}
              href="/dashboard/wallet"
              viewLabel="Open wallet"
            />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <EarningsTrendChart
              data={data.charts.earningsTrend}
              href="/dashboard/ledger?entryType=investment_interest"
              viewLabel="View earnings ledger"
            />
            <AllocationChart
              data={data.charts.allocation}
              href="/dashboard/portfolio"
              viewLabel="View allocation"
            />
          </div>
        </section>
      </DashboardErrorBoundary>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Recent updates
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardPanelCard
            title="Recent activity"
            href="/dashboard/ledger"
            viewLabel="View full ledger"
            accent="sky"
          >
            {data.recentActivity.length ? (
              <LedgerTable entries={data.recentActivity} />
            ) : (
              <EmptyState
                title="No transactions yet"
                description="Deposits, investments, and earnings will appear in your ledger."
              />
            )}
          </DashboardPanelCard>

          <DashboardPanelCard
            title="Notifications"
            href="/dashboard/notifications"
            viewLabel="Open notifications"
            accent="primary"
          >
            {data.recentNotifications.length ? (
              <NotificationsPanel items={data.recentNotifications} showMarkAll={false} />
            ) : (
              <EmptyState
                title="No notifications"
                description="Account alerts and updates will appear here."
                icon={<Bell className="h-5 w-5" />}
              />
            )}
          </DashboardPanelCard>
        </div>
      </section>

      <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-primary/70 via-amber-500/50 to-transparent" aria-hidden />
        <CardHeader>
          <CardTitle className="text-base font-semibold">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/dashboard/deposits/new" className={buttonVariants({ variant: "outline" })}>
            New deposit
          </Link>
          <Link href="/dashboard/withdrawals/new" className={buttonVariants({ variant: "outline" })}>
            New withdrawal
          </Link>
          <Link href="/dashboard/wallet" className={buttonVariants({ variant: "outline" })}>
            View wallet
          </Link>
          <Link href="/dashboard/portfolio" className={buttonVariants({ variant: "outline" })}>
            View portfolio
          </Link>
          <Link href="/dashboard/ledger" className={buttonVariants({ variant: "outline" })}>
            Explore ledger
          </Link>
          <Link href="/dashboard/profile" className={buttonVariants({ variant: "outline" })}>
            Edit profile
          </Link>
          <Link href="/dashboard/security" className={buttonVariants({ variant: "outline" })}>
            Security center
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getDashboardSession();
  if (!session) redirect("/login");

  const { profile } = session;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent
        profileId={profile.id}
        fullName={profile.fullName}
        username={profile.username}
        avatarPath={profile.avatarPath}
      />
    </Suspense>
  );
}
