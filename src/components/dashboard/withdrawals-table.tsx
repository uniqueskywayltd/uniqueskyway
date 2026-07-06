"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { WithdrawalView } from "@/lib/services/withdrawal.service";
import { toast } from "sonner";

type WithdrawalsTableProps = {
  items: WithdrawalView[];
  page: number;
  totalPages: number;
};

const CANCELLABLE = new Set(["draft", "submitted", "under_review"]);

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export function WithdrawalsTable({ items, page, totalPages }: WithdrawalsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const activeStatus = searchParams.get("status") ?? "all";

  if (!items.length) {
    return (
      <EmptyState
        title="No withdrawals yet"
        description="Request a withdrawal when you have available balance."
        hint="Withdrawals are processed after compliance review."
        icon={<ArrowUpRight className="h-5 w-5" aria-hidden />}
        actionLabel="New withdrawal"
        actionHref="/dashboard/withdrawals/new"
      />
    );
  }

  function filterStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") params.delete("status");
    else params.set("status", status);
    params.delete("page");
    router.push(`/dashboard/withdrawals?${params.toString()}`);
  }

  async function cancelWithdrawal(id: string) {
    setCancelling(id);
    try {
      const res = await fetch(`/api/dashboard/withdrawals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cancel failed");
      toast.success("Withdrawal cancelled");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setCancelling(null);
    }
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
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead className="sr-only">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-mono text-xs">{w.id.slice(0, 8)}…</TableCell>
                <TableCell className="font-medium tabular-nums">
                  {formatMoney(w.amount, w.currency)}
                </TableCell>
                <TableCell className="capitalize">{w.methodSlug.replace(/_/g, " ")}</TableCell>
                <TableCell className="max-w-[140px] truncate font-mono text-xs">
                  {w.walletAddress}
                </TableCell>
                <TableCell>
                  <StatusBadge status={w.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {w.submittedAt ? new Date(w.submittedAt).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {w.completedAt ? new Date(w.completedAt).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell>
                  {CANCELLABLE.has(w.status) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={cancelling === w.id}
                      onClick={() => cancelWithdrawal(w.id)}
                    >
                      {cancelling === w.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        "Cancel"
                      )}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>

      <TablePagination
        page={page}
        totalPages={totalPages}
        previousHref={page > 1 ? `/dashboard/withdrawals?page=${page - 1}${querySuffix}` : undefined}
        nextHref={
          page < totalPages ? `/dashboard/withdrawals?page=${page + 1}${querySuffix}` : undefined
        }
      />
    </div>
  );
}
