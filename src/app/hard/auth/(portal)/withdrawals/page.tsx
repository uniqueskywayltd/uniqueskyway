import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { withdrawalService } from "@/lib/services/withdrawal.service";
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

export default async function AdminWithdrawalsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const result = await withdrawalService.listForAdmin({ page: 1, pageSize: 50 });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Withdrawal queue"
        description="Review payout requests and processing status."
        actions={
          <>
            <Link href="/hard/auth/treasury" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Treasury
            </Link>
            <Link href="/hard/auth" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Dashboard
            </Link>
          </>
        }
      />

      {!result.success ? (
        <ServiceErrorState code={result.error.code} message={result.error.message} />
      ) : result.data.items.length === 0 ? (
        <EmptyState
          theme="dark"
          title="No withdrawals in queue"
          description="Pending withdrawal requests will appear here for review."
        />
      ) : (
        <DataTable theme="dark">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Customer</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Method</TableHead>
                <TableHead className="text-slate-400">Destination</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Submitted</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.items.map((w) => (
                <TableRow key={w.id} className="border-slate-800">
                  <TableCell className="text-slate-200">{w.customerName}</TableCell>
                  <TableCell className="font-medium tabular-nums text-white">
                    {formatMoney(w.amount, w.currency)}
                  </TableCell>
                  <TableCell className="capitalize text-slate-200">
                    {w.methodSlug.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate font-mono text-xs text-slate-300">
                    {w.walletAddress}
                  </TableCell>
                  <TableCell>
                    <StatusBadge theme="dark" status={w.status} />
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {w.submittedAt ? new Date(w.submittedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/hard/auth/withdrawals/${w.id}`}
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
