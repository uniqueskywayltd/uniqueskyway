import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ClipboardList,
  DollarSign,
  PieChart,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { adminDashboardService } from "@/lib/services/admin-dashboard.service";
import { AdminPageHeader, DashboardPanelCard, StatCard, StatusBadge } from "@/components/design-system";
import { formatMoney } from "@/lib/utils/money";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const result = await adminDashboardService.getExecutiveDashboard();

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  const d = result.data;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Executive dashboard"
        description={`Operational overview — ${admin.fullName}`}
        actions={
          <>
            <StatusBadge status={d.systemHealth.status} label={`System ${d.systemHealth.status}`} />
            <Link href="/hard/auth/operations" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Operations Center
            </Link>
          </>
        }
      />

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Users</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total users"
            value={String(d.users.total)}
            icon={<Users />}
            href="/hard/auth/customers"
            actionLabel="Manage customers"
            accent="primary"
          />
          <StatCard
            title="Active users"
            value={String(d.users.active)}
            icon={<Users />}
            href="/hard/auth/customers?status=active"
            actionLabel="View active"
            accent="emerald"
          />
          <StatCard
            title="New today"
            value={String(d.users.newRegistrationsToday)}
            icon={<UserPlus />}
            href="/hard/auth/customers"
            actionLabel="Review signups"
            accent="sky"
          />
          <StatCard
            title="New this month"
            value={String(d.users.newRegistrationsMonth)}
            icon={<Calendar />}
            href="/hard/auth/customers"
            actionLabel="Monthly signups"
            accent="violet"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Investments & AUM
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active investments"
            value={String(d.investments.active)}
            icon={<PieChart />}
            href="/hard/auth/investments"
            actionLabel="Open investments"
            accent="violet"
          />
          <StatCard
            title="Matured investments"
            value={String(d.investments.matured)}
            icon={<TrendingUp />}
            href="/hard/auth/investments"
            actionLabel="View matured"
            accent="emerald"
          />
          <StatCard
            title="Pending maturities (7d)"
            value={String(d.investments.pendingMaturities)}
            icon={<Calendar />}
            href="/hard/auth/investments"
            actionLabel="Review maturities"
            accent="amber"
          />
          <StatCard
            title="AUM"
            value={formatMoney(d.financials.aum)}
            icon={<DollarSign />}
            href="/hard/auth/reports"
            actionLabel="View reports"
            accent="primary"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Operations queue
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending deposits"
            value={String(d.operations.pendingDeposits)}
            icon={<ArrowDownLeft />}
            href="/hard/auth/deposits"
            actionLabel="Review deposits"
            accent="sky"
          />
          <StatCard
            title="Pending withdrawals"
            value={String(d.operations.pendingWithdrawals)}
            icon={<ArrowUpRight />}
            href="/hard/auth/withdrawals"
            actionLabel="Review withdrawals"
            accent="rose"
          />
          <StatCard
            title="Pending reviews"
            value={String(d.operations.pendingReviews)}
            icon={<ClipboardList />}
            href="/hard/auth/operations"
            actionLabel="Open operations"
            accent="amber"
          />
          <StatCard
            title="Processing queue"
            value={String(d.operations.processingQueue)}
            icon={<Activity />}
            href="/hard/auth/treasury"
            actionLabel="Open treasury"
            accent="slate"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Financial performance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total ROI paid"
            value={formatMoney(d.financials.totalRoiPaid)}
            icon={<TrendingUp />}
            href="/hard/auth/reports?tab=roi"
            actionLabel="ROI reports"
            accent="emerald"
          />
          <StatCard
            title="Referral commissions"
            value={formatMoney(d.financials.totalReferralCommissions)}
            icon={<Users />}
            href="/hard/auth/referrals"
            actionLabel="Referral center"
            accent="violet"
          />
          <StatCard
            title="Daily revenue"
            value={formatMoney(d.financials.dailyRevenue)}
            icon={<DollarSign />}
            href="/hard/auth/reports"
            actionLabel="Daily reports"
            accent="sky"
          />
          <StatCard
            title="Monthly revenue"
            value={formatMoney(d.financials.monthlyRevenue)}
            icon={<Calendar />}
            href="/hard/auth/reports"
            actionLabel="Monthly reports"
            accent="primary"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          System & ROI
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardPanelCard
            title="ROI processing"
            href="/hard/auth/reports?tab=roi"
            viewLabel="View ROI history"
            accent="emerald"
          >
            <div className="space-y-2 text-sm text-foreground">
              <div className="flex justify-between gap-4 rounded-lg bg-muted/30 px-3 py-2">
                <span className="text-muted-foreground">Today&apos;s ROI</span>
                <span className="font-medium tabular-nums">{formatMoney(d.roi.roiToday)}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-lg bg-muted/30 px-3 py-2">
                <span className="text-muted-foreground">Last run</span>
                <span className="font-medium capitalize">{d.roi.lastRunStatus ?? "Never"}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-lg bg-muted/30 px-3 py-2">
                <span className="text-muted-foreground">Last run at</span>
                <span className="font-medium">
                  {d.roi.lastRunAt ? new Date(d.roi.lastRunAt).toLocaleString() : "—"}
                </span>
              </div>
            </div>
          </DashboardPanelCard>

          <DashboardPanelCard
            title="System health"
            href="/hard/auth/settings"
            viewLabel="Open settings"
            accent="sky"
          >
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Database", d.systemHealth.database],
                ["Supabase", d.systemHealth.supabase],
                ["Email", d.systemHealth.email],
                ["Storage", d.systemHealth.storage],
              ].map(([label, ok]) => (
                <div
                  key={label as string}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/25 px-3 py-2"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <StatusBadge status={ok ? "ok" : "failed"} label={ok ? "OK" : "Down"} />
                </div>
              ))}
            </div>
          </DashboardPanelCard>
        </div>
      </section>

      <DashboardPanelCard
        title="Recent administrative activity"
        href="/hard/auth/audit"
        viewLabel="Open audit center"
        accent="slate"
      >
        {d.recentActivity.length ? (
          <div className="space-y-2">
            {d.recentActivity.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/20 px-4 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium capitalize">{a.action}</span>
                  <span className="text-muted-foreground"> · {a.entityType}</span>
                  {a.entityId ? (
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {a.entityId.slice(0, 8)}
                    </span>
                  ) : null}
                </div>
                <div className="shrink-0 text-right text-muted-foreground">
                  <p>{a.actorLabel}</p>
                  <p className="text-xs">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        )}
      </DashboardPanelCard>
    </div>
  );
}
