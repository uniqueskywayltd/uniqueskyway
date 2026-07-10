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
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const result = await depositService.listForAdmin({ page: 1, pageSize: 50 });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Deposit queue"
        description="Review and approve incoming deposit requests."
        actions={
          <Link href="/hard/auth" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Dashboard
          </Link>
        }
      />

      {!result.success ? (
        <ServiceErrorState code={result.error.code} message={result.error.message} />
      ) : result.data.items.length === 0 ? (
        <EmptyState
          title="No deposits in queue"
          description="Pending deposit requests will appear here for review."
        />
      ) : (
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Customer</TableHead>
                <TableHead className="text-muted-foreground">Plan</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Asset</TableHead>
                <TableHead className="text-muted-foreground">Network</TableHead>
                <TableHead className="text-muted-foreground">TXID</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Submitted</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.items.map((d) => (
                <TableRow key={d.id} className="border-border">
                  <TableCell className="text-foreground">{d.customerName}</TableCell>
                  <TableCell className="text-foreground">{d.planName ?? "—"}</TableCell>
                  <TableCell className="font-medium tabular-nums text-foreground">
                    {formatMoney(d.amount, d.currency)}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {d.assetSymbolSnapshot ?? "—"}
                  </TableCell>
                  <TableCell className="text-foreground">{d.networkSnapshot ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-foreground/80 max-w-[120px] truncate">
                    {d.externalTransactionRef}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={d.status}
                      label={d.status === "submitted" ? "Awaiting Verification" : undefined}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.submittedAt ? new Date(d.submittedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/hard/auth/deposits/${d.id}`}
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
