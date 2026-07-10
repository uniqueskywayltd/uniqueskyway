import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { treasuryService } from "@/lib/services/treasury.service";
import { withdrawalService } from "@/lib/services/withdrawal.service";
import { StatCard } from "@/components/design-system/stat-card";
import { formatMoney } from "@/lib/utils/money";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminTreasuryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const [treasuryStats, withdrawalStats, queueResult] = await Promise.all([
    treasuryService.getStats(),
    withdrawalService.getAdminStats(),
    treasuryService.listQueue({ page: 1, pageSize: 20 }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Treasury operations</h1>
          <p className="text-muted-foreground">Payout queue and withdrawal volume</p>
        </div>
        <Link href="/hard/auth/withdrawals" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Withdrawal queue
        </Link>
      </div>

      {!treasuryStats.success ? (
        <ServiceErrorState code={treasuryStats.error.code} message={treasuryStats.error.message} />
      ) : !withdrawalStats.success ? (
        <ServiceErrorState code={withdrawalStats.error.code} message={withdrawalStats.error.message} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Pending payouts" value={String(treasuryStats.data.pendingCount)} />
          <StatCard title="Processing" value={String(treasuryStats.data.processingCount)} />
          <StatCard title="Completed today" value={String(treasuryStats.data.completedToday)} />
          <StatCard title="Failed payouts" value={String(treasuryStats.data.failedCount)} />
          <StatCard title="Daily payout volume" value={formatMoney(treasuryStats.data.volumeToday)} />
          <StatCard title="Pending withdrawals" value={String(withdrawalStats.data.pendingCount)} />
          <StatCard title="Processing withdrawals" value={String(withdrawalStats.data.processingCount)} />
          <StatCard
            title="Avg processing time"
            value={
              treasuryStats.data.averageProcessingHours !== null
                ? `${treasuryStats.data.averageProcessingHours.toFixed(1)}h`
                : "—"
            }
          />
        </div>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Treasury queue</h2>
        {!queueResult.success ? (
          <ServiceErrorState code={queueResult.error.code} message={queueResult.error.message} />
        ) : queueResult.data.items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            No payouts in the treasury queue.
          </div>
        ) : (
          <div className="space-y-2">
            {queueResult.data.items.map((p) => (
              <Link
                key={p.id}
                href={`/hard/auth/withdrawals/${p.withdrawalRequestId}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/40"
              >
                <div>
                  <p className="font-medium">{p.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.providerSlug} · {p.id.slice(0, 8)}…
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="capitalize">
                    {p.status}
                  </Badge>
                  <p className="font-semibold">{formatMoney(p.amount, p.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
