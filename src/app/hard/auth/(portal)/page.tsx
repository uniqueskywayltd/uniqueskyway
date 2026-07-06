import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { adminDashboardService } from "@/lib/services/admin-dashboard.service";
import { AdminPageHeader, StatCard, StatusBadge } from "@/components/design-system";
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
            <StatusBadge theme="dark" status={d.systemHealth.status} label={`System ${d.systemHealth.status}`} />
            <Link href="/hard/auth/operations" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Operations Center
            </Link>
          </>
        }
      />

      <div>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Users</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard theme="dark" title="Total users" value={String(d.users.total)} />
          <StatCard theme="dark" title="Active users" value={String(d.users.active)} />
          <StatCard theme="dark" title="New today" value={String(d.users.newRegistrationsToday)} />
          <StatCard theme="dark" title="New this month" value={String(d.users.newRegistrationsMonth)} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Investments & AUM</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard theme="dark" title="Active investments" value={String(d.investments.active)} />
          <StatCard theme="dark" title="Matured investments" value={String(d.investments.matured)} />
          <StatCard theme="dark" title="Pending maturities (7d)" value={String(d.investments.pendingMaturities)} />
          <StatCard theme="dark" title="AUM" value={formatMoney(d.financials.aum)} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Operations queue</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard theme="dark" title="Pending deposits" value={String(d.operations.pendingDeposits)} />
          <StatCard theme="dark" title="Pending withdrawals" value={String(d.operations.pendingWithdrawals)} />
          <StatCard theme="dark" title="Pending reviews" value={String(d.operations.pendingReviews)} />
          <StatCard theme="dark" title="Processing queue" value={String(d.operations.processingQueue)} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Financial performance</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard theme="dark" title="Total ROI paid" value={formatMoney(d.financials.totalRoiPaid)} />
          <StatCard theme="dark" title="Referral commissions" value={formatMoney(d.financials.totalReferralCommissions)} />
          <StatCard theme="dark" title="Daily revenue" value={formatMoney(d.financials.dailyRevenue)} />
          <StatCard theme="dark" title="Monthly revenue" value={formatMoney(d.financials.monthlyRevenue)} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 font-semibold">ROI Processing</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Today&apos;s ROI</span>
              <span>{formatMoney(d.roi.roiToday)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last run</span>
              <span className="capitalize">{d.roi.lastRunStatus ?? "Never"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last run at</span>
              <span>
                {d.roi.lastRunAt ? new Date(d.roi.lastRunAt).toLocaleString() : "—"}
              </span>
            </div>
          </div>
          <Link href="/hard/auth/reports?tab=roi" className="mt-4 inline-block text-sm text-blue-400 hover:underline">
            View ROI history →
          </Link>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 font-semibold">System Health</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Database", d.systemHealth.database],
              ["Supabase", d.systemHealth.supabase],
              ["Email", d.systemHealth.email],
              ["Storage", d.systemHealth.storage],
            ].map(([label, ok]) => (
              <div key={label as string} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
                <span className="text-slate-400">{label}</span>
                <StatusBadge theme="dark" status={ok ? "ok" : "failed"} label={ok ? "OK" : "Down"} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Recent administrative activity</h2>
          <Link href="/hard/auth/audit" className="text-sm text-blue-400 hover:underline">
            Audit center →
          </Link>
        </div>
        {d.recentActivity.length ? (
          <div className="space-y-2">
            {d.recentActivity.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg bg-slate-800/40 px-4 py-2 text-sm"
              >
                <div>
                  <span className="font-medium capitalize">{a.action}</span>
                  <span className="text-slate-400"> · {a.entityType}</span>
                  {a.entityId ? (
                    <span className="ml-2 font-mono text-xs text-slate-500">{a.entityId.slice(0, 8)}</span>
                  ) : null}
                </div>
                <div className="text-right text-slate-400">
                  <p>{a.actorLabel}</p>
                  <p className="text-xs">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No recent activity.</p>
        )}
      </div>
    </div>
  );
}
