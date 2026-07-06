import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Clock,
  Lock,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getCustomerProfile, getSessionUser } from "@/lib/auth/session";
import { dashboardService } from "@/lib/services/dashboard.service";
import { StatCard } from "@/components/design-system/stat-card";
import { PageHeader } from "@/components/design-system/page-header";
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
}: {
  profileId: string;
  fullName: string;
  username: string;
}) {
  const result = await dashboardService.getDashboardData(profileId);

  if (!result.success) {
    return (
      <div className="space-y-8">
        <PageHeader
          title={`Welcome back, ${fullName}`}
          description={`@${username} · Investor dashboard`}
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
      <PageHeader
        title={`Welcome back, ${fullName}`}
        description={`@${username} · Investor dashboard`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total portfolio value" value={formatMoney(w.totalPortfolioValue, currency)} icon={<Wallet />} />
        <StatCard title="Available balance" value={formatMoney(w.availableBalance, currency)} icon={<PiggyBank />} />
        <StatCard title="Locked balance" value={formatMoney(w.lockedBalance, currency)} icon={<Lock />} />
        <StatCard title="Pending balance" value={formatMoney(w.pendingBalance, currency)} icon={<Clock />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total deposits" value={formatMoney(w.totalDeposits, currency)} icon={<ArrowDownLeft />} />
        <StatCard title="Total withdrawals" value={formatMoney(w.totalWithdrawals, currency)} icon={<ArrowUpRight />} />
        <StatCard title="Total ROI earned" value={formatMoney(w.totalRoiEarned, currency)} icon={<TrendingUp />} />
        <StatCard title="Referral earnings" value={formatMoney(w.referralEarnings, currency)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active investments"
          value={String(data.portfolio.activeInvestments)}
          description={`${data.portfolio.totalInvestments} total`}
        />
        <StatCard title="Matured investments" value={String(data.portfolio.maturedInvestments)} />
        <StatCard title="Pending investments" value={String(data.portfolio.pendingInvestments)} />
        <StatCard
          title="Pending transactions"
          value={String(w.pendingTransactionCount)}
          description={`${w.pendingDepositCount} deposits · ${w.pendingWithdrawalCount} withdrawals`}
        />
      </div>

      <DashboardErrorBoundary fallbackTitle="Charts failed to load">
        <div className="grid gap-6 lg:grid-cols-2">
          <PortfolioGrowthChart data={data.charts.portfolioGrowth} />
          <BalanceHistoryChart data={data.charts.balanceHistory} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <EarningsTrendChart data={data.charts.earningsTrend} />
          <AllocationChart data={data.charts.allocation} />
        </div>
      </DashboardErrorBoundary>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Link href="/dashboard/ledger" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length ? (
              <LedgerTable entries={data.recentActivity} />
            ) : (
              <EmptyState title="No transactions yet" description="Deposits, investments, and earnings will appear in your ledger." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Notifications</CardTitle>
            <Link href="/dashboard/notifications" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentNotifications.length ? (
              <NotificationsPanel items={data.recentNotifications} showMarkAll={false} />
            ) : (
              <EmptyState title="No notifications" description="Account alerts and updates will appear here." icon={<Bell className="h-5 w-5" />} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/dashboard/deposits/new" className={buttonVariants({ variant: "outline" })}>New deposit</Link>
          <Link href="/dashboard/withdrawals/new" className={buttonVariants({ variant: "outline" })}>New withdrawal</Link>
          <Link href="/dashboard/wallet" className={buttonVariants({ variant: "outline" })}>View wallet</Link>
          <Link href="/dashboard/portfolio" className={buttonVariants({ variant: "outline" })}>View portfolio</Link>
          <Link href="/dashboard/ledger" className={buttonVariants({ variant: "outline" })}>Explore ledger</Link>
          <Link href="/dashboard/profile" className={buttonVariants({ variant: "outline" })}>Edit profile</Link>
          <Link href="/dashboard/security" className={buttonVariants({ variant: "outline" })}>Security center</Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getCustomerProfile(user.authUserId);
  if (!profile) redirect("/login");

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent profileId={profile.id} fullName={profile.fullName} username={profile.username} />
    </Suspense>
  );
}
