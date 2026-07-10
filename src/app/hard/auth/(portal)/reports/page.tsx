import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { reportingService } from "@/lib/services/reporting.service";
import { roiSchedulerService } from "@/lib/services/roi-scheduler.service";
import { formatMoney } from "@/lib/utils/money";
import { StatCard } from "@/components/design-system/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminReportsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const [daily, referrals, investments, roiRuns] = await Promise.all([
    reportingService.getDailyActivity(14),
    reportingService.getReferralPerformance(10),
    reportingService.getInvestmentPerformance(),
    roiSchedulerService.listRuns(1, 20),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground">Export-ready financial and operational reports</p>
      </div>

      {investments.success ? (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard title="Active investments" value={String(investments.data.activeCount)} />
          <StatCard title="Matured" value={String(investments.data.maturedCount)} />
          <StatCard title="Total principal" value={formatMoney(investments.data.totalPrincipal)} />
          <StatCard title="ROI credited" value={formatMoney(investments.data.totalRoiCredited)} />
        </div>
      ) : null}

      {daily.success ? (
        <div>
          <h2 className="mb-4 font-semibold">Daily activity (14 days)</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">New users</TableHead>
                  <TableHead className="text-muted-foreground">Deposits</TableHead>
                  <TableHead className="text-muted-foreground">Volume</TableHead>
                  <TableHead className="text-muted-foreground">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daily.data.slice(0, 14).map((row) => (
                  <TableRow key={row.date} className="border-border">
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.newUsers}</TableCell>
                    <TableCell>{row.depositsApproved}</TableCell>
                    <TableCell>{formatMoney(row.depositVolume)}</TableCell>
                    <TableCell>{formatMoney(row.roiGenerated)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {roiRuns.success ? (
        <div>
          <h2 className="mb-4 font-semibold">ROI processing history</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Started</TableHead>
                  <TableHead className="text-muted-foreground">Mode</TableHead>
                  <TableHead className="text-muted-foreground">Processed</TableHead>
                  <TableHead className="text-muted-foreground">ROI</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roiRuns.data.items.map((run) => (
                  <TableRow key={run.id} className="border-border">
                    <TableCell className="text-sm">{new Date(run.startedAt).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{run.mode.replace("_", " ")}</TableCell>
                    <TableCell>{run.investmentsProcessed}</TableCell>
                    <TableCell>{formatMoney(run.roiGenerated)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{run.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {referrals.success ? (
        <div>
          <h2 className="mb-4 font-semibold">Top referrers</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Referrer</TableHead>
                  <TableHead className="text-muted-foreground">Referrals</TableHead>
                  <TableHead className="text-muted-foreground">Commissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.data.topReferrers.map((r) => (
                  <TableRow key={r.profileId} className="border-border">
                    <TableCell>{r.fullName}</TableCell>
                    <TableCell>{r.referralCount}</TableCell>
                    <TableCell>{formatMoney(r.totalCommissions)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
