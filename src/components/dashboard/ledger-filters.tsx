"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export function LedgerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`/dashboard/ledger?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="grid gap-4 rounded-xl border border-border/60 bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="ledger-search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="ledger-search"
            className="pl-9"
            placeholder="Reference or description"
            defaultValue={searchParams.get("search") ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                update("search", (e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="referenceId">Reference ID</Label>
        <Input
          id="referenceId"
          placeholder="Exact reference"
          defaultValue={searchParams.get("referenceId") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              update("referenceId", (e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="entryType">Type</Label>
        <Select
          defaultValue={searchParams.get("entryType") ?? "all"}
          onValueChange={(v) => update("entryType", v === "all" || !v ? "" : v)}
        >
          <SelectTrigger id="entryType">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
            <SelectItem value="investment_principal">Investment</SelectItem>
            <SelectItem value="investment_interest">Interest</SelectItem>
            <SelectItem value="referral_commission">Referral</SelectItem>
            <SelectItem value="admin_adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          defaultValue={searchParams.get("status") ?? "all"}
          onValueChange={(v) => update("status", v === "all" || !v ? "" : v)}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="from">From</Label>
        <Input
          id="from"
          type="date"
          defaultValue={searchParams.get("from") ?? ""}
          onChange={(e) => update("from", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="to">To</Label>
        <Input
          id="to"
          type="date"
          defaultValue={searchParams.get("to") ?? ""}
          onChange={(e) => update("to", e.target.value)}
        />
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-6">
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.push("/dashboard/ledger")}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
