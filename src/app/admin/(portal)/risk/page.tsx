import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { riskService } from "@/lib/services/risk.service";
import { StatCard } from "@/components/design-system/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminRiskPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/admin/login");

  const [insights, events] = await Promise.all([
    riskService.getInsights(),
    riskService.listForAdmin({ page: 1, pageSize: 50 }),
  ]);

  if (!insights.success) {
    return <ServiceErrorState code={insights.error.code} message={insights.error.message} />;
  }
  if (!events.success) {
    return <ServiceErrorState code={events.error.code} message={events.error.message} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Risk & Compliance Center</h1>
        <p className="text-slate-400">Operational insights — no automated blocking</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="High severity events" value={String(insights.data.highSeverityCount)} />
        <StatCard title="Failed logins (24h)" value={String(insights.data.failedLogins24h)} />
        <StatCard title="Large withdrawals (24h)" value={String(insights.data.largeWithdrawals)} />
        <StatCard title="Rapid deposits" value={String(insights.data.rapidDeposits)} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Time</TableHead>
              <TableHead className="text-slate-400">Event</TableHead>
              <TableHead className="text-slate-400">Severity</TableHead>
              <TableHead className="text-slate-400">Profile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.data.items.map((e) => (
              <TableRow key={e.id} className="border-slate-800">
                <TableCell className="text-sm">{new Date(e.createdAt).toLocaleString()}</TableCell>
                <TableCell>{e.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{e.severity}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{e.profileId.slice(0, 8)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
