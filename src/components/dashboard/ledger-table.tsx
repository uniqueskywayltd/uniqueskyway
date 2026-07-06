"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, TablePagination } from "@/components/design-system";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMoney } from "@/lib/utils/money";
import type { LedgerEntryView } from "@/lib/services/wallet.service";

type LedgerTableProps = {
  entries: LedgerEntryView[];
  showPagination?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

export function LedgerTable({
  entries,
  showPagination,
  page = 1,
  totalPages = 1,
  onPageChange,
}: LedgerTableProps) {
  const [selected, setSelected] = useState<LedgerEntryView | null>(null);
  const searchParams = useSearchParams();

  function pageHref(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    return `/dashboard/ledger?${params.toString()}`;
  }

  return (
    <>
      <DataTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="sr-only">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-mono text-xs">{entry.referenceId}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {entry.entryType.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {entry.description ?? "—"}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    entry.direction === "credit" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {entry.direction === "credit" ? "+" : "−"}
                  {formatMoney(entry.amount, entry.currency)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected(entry)}
                    aria-label={`View details for ${entry.referenceId}`}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>

      {showPagination ? (
        <TablePagination
          page={page}
          totalPages={totalPages}
          onPrevious={onPageChange && page > 1 ? () => onPageChange(page - 1) : undefined}
          onNext={onPageChange && page < totalPages ? () => onPageChange(page + 1) : undefined}
          previousHref={!onPageChange && page > 1 ? pageHref(page - 1) : undefined}
          nextHref={!onPageChange && page < totalPages ? pageHref(page + 1) : undefined}
        />
      ) : null}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>Transaction details</SheetTitle>
                <SheetDescription>Immutable ledger record</SheetDescription>
              </SheetHeader>
              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Reference ID</dt>
                  <dd className="mt-1 font-mono">{selected.referenceId}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {selected.direction === "credit" ? "+" : "−"}
                    {formatMoney(selected.amount, selected.currency)}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="mt-1 capitalize">{selected.entryType.replace(/_/g, " ")}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="mt-1 capitalize">{selected.status}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Direction</dt>
                    <dd className="mt-1 capitalize">{selected.direction}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Currency</dt>
                    <dd className="mt-1">{selected.currency}</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="mt-1">{selected.description ?? "—"}</dd>
                </div>
                {selected.relatedReferenceId ? (
                  <div>
                    <dt className="text-muted-foreground">Related investment</dt>
                    <dd className="mt-1 font-mono text-xs">{selected.relatedReferenceId}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-muted-foreground">Timestamp</dt>
                  <dd className="mt-1">{new Date(selected.createdAt).toLocaleString()}</dd>
                </div>
              </dl>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
