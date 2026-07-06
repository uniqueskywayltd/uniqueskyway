import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PieChart } from "lucide-react";
import { getCustomerProfile, getSessionUser } from "@/lib/auth/session";
import { portfolioService } from "@/lib/services/portfolio.service";
import { PageHeader } from "@/components/design-system/page-header";
import { StatCard } from "@/components/design-system/stat-card";
import { EmptyState } from "@/components/design-system/empty-state";
import { AllocationChart } from "@/components/dashboard/dashboard-charts";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";
import { DataTable, SectionHeading, StatusBadge } from "@/components/design-system";
import { formatMoney } from "@/lib/utils/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function PortfolioContent({ profileId }: { profileId: string }) {
  const result = await portfolioService.getPortfolioData(profileId);

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  const data = result.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfolio"
        description="Investment positions, ROI, and allocation from your ledger-backed accounts."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active investments" value={String(data.activeInvestments)} />
        <StatCard title="Matured investments" value={String(data.maturedInvestments)} />
        <StatCard title="Pending investments" value={String(data.pendingInvestments)} />
        <StatCard title="Total principal" value={formatMoney(data.totalPrincipal, data.currency)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="ROI earned (ledger)" value={formatMoney(data.totalRoiEarned, data.currency)} />
        <StatCard title="Accrued interest" value={formatMoney(data.totalAccruedInterest, data.currency)} />
      </div>

      <AllocationChart data={data.allocation} />

      <section>
        <SectionHeading title="Investment positions" />
        {data.positions.length ? (
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Accrued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Matures</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.positions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                  <Link href={`/dashboard/portfolio/${p.id}`} className="text-primary hover:underline">
                    {p.planName}
                  </Link>
                </TableCell>
                    <TableCell>{formatMoney(p.principalAmount, data.currency)}</TableCell>
                    <TableCell>{formatMoney(p.accruedInterest, data.currency)}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.maturesAt ? new Date(p.maturesAt).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTable>
        ) : (
          <EmptyState
            title="No investments yet"
            description="When you invest, active and matured positions will appear here with ROI summaries."
            icon={<PieChart className="h-5 w-5" />}
          />
        )}
      </section>
    </div>
  );
}

export default async function PortfolioPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getCustomerProfile(user.authUserId);
  if (!profile) redirect("/login");

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PortfolioContent profileId={profile.id} />
    </Suspense>
  );
}
