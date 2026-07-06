"use client";

import { useCallback, useState } from "react";
import { Loader2, Play, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type MigrationRun = {
  id: string;
  runKey: string;
  label: string | null;
  status: string;
  dryRun: boolean;
  currentPhase: string | null;
  stats: Record<string, number> | null;
  errorMessage: string | null;
  createdAt: string;
};

type BalanceException = {
  email: string;
  legacyTotal: string;
  newTotal: string;
  difference: string;
};

export function MigrationDashboard({
  initialRuns = [],
}: {
  initialRuns?: MigrationRun[];
}) {
  const [runs, setRuns] = useState<MigrationRun[]>(initialRuns);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [selectedRun, setSelectedRun] = useState<MigrationRun | null>(null);
  const [exceptions, setExceptions] = useState<BalanceException[]>([]);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hard/auth/migration");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load runs");
      setRuns(data.items ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load migration runs");
    } finally {
      setLoading(false);
    }
  }, []);

  const startMigration = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/hard/auth/migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun, label: dryRun ? "Dry Run" : "Live Migration" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Migration failed");
      toast.success(dryRun ? "Dry run completed" : "Migration completed");
      await loadRuns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setRunning(false);
    }
  };

  const loadRunDetail = async (runId: string) => {
    try {
      const res = await fetch(`/api/hard/auth/migration/${runId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load run");
      setSelectedRun(data.run);
      setExceptions(data.balanceExceptions ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load run detail");
    }
  };

  const rollbackRun = async (runId: string) => {
    if (!confirm("Rollback this migration run? This removes all imported data for this run.")) {
      return;
    }
    try {
      const res = await fetch(`/api/hard/auth/migration/${runId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rollback failed");
      toast.success(`Rolled back ${data.deleted} profiles`);
      await loadRuns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rollback failed");
    }
  };

  const latestStats = runs[0]?.stats ?? {};

  return (
    <div className="space-y-6">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-400" />
          <div>
            <p className="font-medium text-amber-200">Super Admin Only</p>
            <p className="text-sm text-slate-400">
              Legacy migration tools are restricted to Super Admin. The legacy SQL dump is
              read-only and never modified. Always run a dry run before live import.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="dry-run"
            checked={dryRun}
            onCheckedChange={(v) => setDryRun(v === true)}
          />
          <Label htmlFor="dry-run">Dry run (no database writes)</Label>
        </div>
        <Button onClick={startMigration} disabled={running}>
          {running ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {dryRun ? "Run Dry Migration" : "Run Live Migration"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users extracted" value={latestStats.usersExtracted} />
        <Stat label="Users loaded" value={latestStats.usersLoaded} />
        <Stat label="Ledger entries" value={latestStats.ledgerEntriesLoaded} />
        <Stat label="Balance exceptions" value={latestStats.balanceExceptions} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Migration Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : runs.length === 0 ? (
            <p className="text-sm text-slate-400">No migration runs yet.</p>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{run.label ?? run.runKey}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(run.createdAt).toLocaleString()} · {run.runKey}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={run.dryRun ? "secondary" : "destructive"}>
                      {run.dryRun ? "Dry Run" : "Live"}
                    </Badge>
                    <Badge
                      variant={
                        run.status === "completed"
                          ? "default"
                          : run.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {run.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadRunDetail(run.id)}
                    >
                      Details
                    </Button>
                    {!run.dryRun && run.status === "completed" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rollbackRun(run.id)}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Rollback
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRun ? (
        <Card>
          <CardHeader>
            <CardTitle>Run Detail — {selectedRun.runKey}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedRun.errorMessage ? (
              <p className="text-sm text-red-400">{selectedRun.errorMessage}</p>
            ) : null}
            <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
              {JSON.stringify(selectedRun.stats, null, 2)}
            </pre>
            {exceptions.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium text-red-400">
                  Balance Exceptions ({exceptions.length})
                </p>
                <div className="max-h-64 overflow-auto space-y-1 text-xs">
                  {exceptions.map((ex) => (
                    <div key={ex.email} className="rounded border border-red-500/20 px-3 py-2">
                      {ex.email}: legacy {ex.legacyTotal} → new {ex.newTotal} (Δ {ex.difference})
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-emerald-400">Zero balance discrepancies</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-white">{value ?? "—"}</p>
      </CardContent>
    </Card>
  );
}
