import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { depositService } from "@/lib/services/deposit.service";
import {
  AdminPageHeader,
  DataTable,
  EmptyState,
  StatusBadge,
} from "@/components/design-system";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/utils/money";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminDepositsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/admin/login");

  const result = await depositService.listForAdmin({ page: 1, pageSize: 50 });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Deposit queue"
        description="Review and approve incoming deposit requests."
        actions={
          <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Dashboard
          </Link>
        }
      />

      {!result.success ? (
        <ServiceErrorState code={result.error.code} message={result.error.message} />
      ) : result.data.items.length === 0 ? (
        <EmptyState
          theme="dark"
          title="No deposits in queue"
          description="Pending deposit requests will appear here for review."
        />
      ) : (
        <DataTable theme="dark">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Customer</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400">Reference</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Submitted</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.items.map((d) => (
                <TableRow key={d.id} className="border-slate-800">
                  <TableCell className="text-slate-200">{d.customerName}</TableCell>
                  <TableCell className="font-medium tabular-nums text-white">
                    {formatMoney(d.amount, d.currency)}
                  </TableCell>
                  <TableCell className="text-slate-200">{d.planName ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-300">
                    {d.externalTransactionRef}
                  </TableCell>
                  <TableCell>
                    <StatusBadge theme="dark" status={d.status} />
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {d.submittedAt ? new Date(d.submittedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/deposits/${d.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Review
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTable>
      )}
    </div>
  );
}
