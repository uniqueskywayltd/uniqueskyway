import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { referralAdminService } from "@/lib/services/referral-admin.service";
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
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminReferralsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const [overview, commissions] = await Promise.all([
    referralAdminService.getOverview(),
    referralAdminService.listCommissions(1, 30),
  ]);

  if (!overview.success) {
    return <ServiceErrorState code={overview.error.code} message={overview.error.message} />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Referral Administration</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total relationships" value={String(overview.data.totalRelationships)} />
        <StatCard title="Commissions paid" value={formatMoney(overview.data.totalCommissionsPaid)} />
        <StatCard title="Commissions today" value={formatMoney(overview.data.commissionsToday)} />
      </div>

      <div>
        <h2 className="mb-4 font-semibold">Top referrers</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Referrer</TableHead>
                <TableHead className="text-muted-foreground">Code</TableHead>
                <TableHead className="text-muted-foreground">Referrals</TableHead>
                <TableHead className="text-muted-foreground">Commissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.data.topReferrers.map((r) => (
                <TableRow key={r.profileId} className="border-border">
                  <TableCell>
                    <Link href={`/hard/auth/customers/${r.profileId}`} className="hover:underline">
                      {r.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.referralCode}</TableCell>
                  <TableCell>{r.directReferrals}</TableCell>
                  <TableCell>{formatMoney(r.totalCommissions)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {commissions.success ? (
        <div>
          <h2 className="mb-4 font-semibold">Commission history</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Referrer</TableHead>
                  <TableHead className="text-muted-foreground">Referred</TableHead>
                  <TableHead className="text-muted-foreground">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.data.items.map((c) => (
                  <TableRow key={c.id} className="border-border">
                    <TableCell className="text-sm">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{c.referrerName}</TableCell>
                    <TableCell>{c.referredName}</TableCell>
                    <TableCell>{formatMoney(c.commissionAmount)}</TableCell>
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
