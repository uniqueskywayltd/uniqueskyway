"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PaymentMethodAdminView } from "@/lib/services/payment-method.service";
import { toast } from "sonner";

export function AdminPaymentMethodsManager({ methods }: { methods: PaymentMethodAdminView[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleActive(id: string, isActive: boolean) {
    setLoading(id);
    try {
      const res = await fetch("/api/hard/auth/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Payment method updated");
      router.refresh();
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Method</TableHead>
            <TableHead className="text-muted-foreground">Type</TableHead>
            <TableHead className="text-muted-foreground">Proof</TableHead>
            <TableHead className="text-muted-foreground">Order</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {methods.map((m) => (
            <TableRow key={m.id} className="border-border">
              <TableCell>
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{m.slug}</p>
              </TableCell>
              <TableCell className="capitalize">{m.methodType.replace(/_/g, " ")}</TableCell>
              <TableCell>{m.requiresProof ? "Required" : "No"}</TableCell>
              <TableCell>{m.sortOrder}</TableCell>
              <TableCell>
                <Badge variant={m.isActive ? "default" : "outline"}>
                  {m.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading === m.id}
                  onClick={() => toggleActive(m.id, !m.isActive)}
                >
                  {loading === m.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : m.isActive ? (
                    "Deactivate"
                  ) : (
                    "Activate"
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
