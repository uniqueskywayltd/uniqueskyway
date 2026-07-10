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
          title="No withdrawals in queue"
          description="Pending withdrawal requests will appear here for review."
        />
      ) : (
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Customer</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Method</TableHead>
                <TableHead className="text-muted-foreground">Destination</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Submitted</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.items.map((w) => (
                <TableRow key={w.id} className="border-border">
                  <TableCell className="text-foreground">{w.customerName}</TableCell>
                  <TableCell className="font-medium tabular-nums text-foreground">
                    {formatMoney(w.amount, w.currency)}
                  </TableCell>
                  <TableCell className="capitalize text-foreground">
                    {w.methodSlug.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate font-mono text-xs text-foreground/80">
                    {w.walletAddress}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={w.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
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
