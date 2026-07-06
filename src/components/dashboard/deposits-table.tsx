"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownLeft } from "lucide-react";
import {
  DataTable,
  EmptyState,
  FilterChips,
  StatusBadge,
  TablePagination,
} from "@/components/design-system";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/utils/money";
import type { DepositView } from "@/lib/services/deposit.service";

type DepositsTableProps = {
  items: DepositView[];
  page: number;
  totalPages: number;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function DepositsTable({ items, page, totalPages }: DepositsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status") ?? "all";

  if (!items.length) {
    return (
      <EmptyState
        title="No deposits yet"
        description="Submit your first deposit to start investing."
        hint="Deposits are reviewed before funds are credited to your wallet."
        icon={<ArrowDownLeft className="h-5 w-5" aria-hidden />}
        actionLabel="New deposit"
        actionHref="/dashboard/deposits/new"
      />
    );
  }

  function filterStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") params.delete("status");
    else params.set("status", status);
    params.delete("page");
    router.push(`/dashboard/deposits?${params.toString()}`);
  }

  const statusQuery = searchParams.get("status");
  const querySuffix = statusQuery ? `&status=${statusQuery}` : "";

  return (
    <div className="space-y-4">
      <FilterChips options={STATUS_OPTIONS} value={activeStatus} onChange={filterStatus} />

      <DataTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs">{d.externalTransactionRef}</TableCell>
                <TableCell>{d.planName ?? "—"}</TableCell>
                <TableCell className="font-medium tabular-nums">
                  {formatMoney(d.amount, d.currency)}
                </TableCell>
                <TableCell className="capitalize">{d.paymentMethodSlug.replace("_", " ")}</TableCell>
                <TableCell>
                  <StatusBadge status={d.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {d.submittedAt ? new Date(d.submittedAt).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>

      <TablePagination
        page={page}
        totalPages={totalPages}
        previousHref={page > 1 ? `/dashboard/deposits?page=${page - 1}${querySuffix}` : undefined}
        nextHref={page < totalPages ? `/dashboard/deposits?page=${page + 1}${querySuffix}` : undefined}
      />
    </div>
  );
}
