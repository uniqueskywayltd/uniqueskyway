"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Play, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PHASES = ["extract", "validate", "transform", "load", "verify", "report"] as const;

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

type SourcePreview = {
  sourcePath: string;
  users: number;
  transactions: number;
  admins: number;
};

export function MigrationDashboard({
  initialRuns = [],
  initialSource = null,
}: {
  initialRuns?: MigrationRun[];
  initialSource?: SourcePreview | null;
}) {
  const [runs, setRuns] = useState<MigrationRun[]>(initialRuns);
  const [source, setSource] = useState<SourcePreview | null>(initialSource);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [progressPhase, setProgressPhase] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<MigrationRun | null>(null);
  const [exceptions, setExceptions] = useState<BalanceException[]>([]);
  const [syncingPasswords, setSyncingPasswords] = useState(false);

  async function syncLegacyPasswords() {
    if (
      !confirm(
        "Apply legacy passwords from the SQL dump to all migrated customer accounts? Users can then sign in with their original email and password.",
      )
    ) {
      return;
    }
    setSyncingPasswords(true);
    try {
      const res = await fetch("/api/hard/auth/migration/sync-passwords", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Password sync failed");
      toast.success(
        `Synced ${data.updated} passwords · ${data.resetEmailsSent} reset emails sent · ${data.failed?.length ?? 0} failed`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password sync failed");
    } finally {
      setSyncingPasswords(false);
    }
  }

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hard/auth/migration");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load runs");
      setRuns(data.items ?? []);
      if (data.source) setSource(data.source);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load migration runs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const runPhasedMigration = async (runId: string) => {
    let done = false;
    let guard = 0;

    while (!done && guard < PHASES.length + 2) {
      guard += 1;
      const res = await fetch(`/api/hard/auth/migration/${runId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance" }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail =
          typeof data.details === "string"
            ? data.details
            : data.error ?? "Migration phase failed";
        throw new Error(detail);
      }

      if (data.phase) {
        setProgressPhase(String(data.phase));
      }

      done = Boolean(data.done);
      if (data.status === "failed") {
        throw new Error("Migration failed");
      }
    }

    if (!done) {
      throw new Error("Migration stopped before completion. Resume the run to continue.");
    }
  };

  const startMigration = async () => {
    setRunning(true);
    setProgressPhase("starting");
    try {
      const startRes = await fetch("/api/hard/auth/migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun,
          label: dryRun ? "Dry Run" : "Live Migration",
          mode: "start",
        }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error ?? "Failed to start migration");
      }

      await runPhasedMigration(startData.runId as string);
      toast.success(dryRun ? "Dry run completed" : "Live migration completed");
      await loadRuns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Migration failed");
      await loadRuns();
    } finally {
      setRunning(false);
      setProgressPhase(null);
    }
  };

  const resumeMigration = async (runId: string) => {
    setRunning(true);
    try {
      await runPhasedMigration(runId);
      toast.success("Migration resumed and completed");
      await loadRuns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Resume failed");
      await loadRuns();
    } finally {
      setRunning(false);
      setProgressPhase(null);
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
  const migratedCount = runs.find((run) => !run.dryRun && run.status === "completed")?.stats
    ?.usersLoaded;

  return (
    <div className="space-y-6">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-foreground">Super Admin Only</p>
            <p className="text-sm text-muted-foreground">
              Live migration runs phase-by-phase to avoid server timeouts. Always dry run first.
              Migrated customers appear in{" "}
              <Link href="/hard/auth/customers?source=legacy" className="font-medium text-primary hover:underline">
                Customers → Legacy
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legacy SQL source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {source ? (
            <>
              <p className="font-mono text-xs text-muted-foreground break-all">{source.sourcePath}</p>
              <div className="flex flex-wrap gap-4 text-foreground">
                <span>{source.users} users</span>
                <span>{source.transactions} transactions</span>
                <span>{source.admins} admins</span>
              </div>
            </>
          ) : (
            <p className="text-destructive">Legacy SQL file not found in deployment bundle.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legacy login passwords</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Migrated users are created in Supabase Auth. Run this once after live migration so customers
            can sign in with the same email and password they used on the old site.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={syncingPasswords || !source}
            onClick={syncLegacyPasswords}
          >
            {syncingPasswords ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sync legacy passwords
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="dry-run"
            checked={dryRun}
            onCheckedChange={(v) => setDryRun(v === true)}
            disabled={running}
          />
          <Label htmlFor="dry-run">Dry run (no database writes)</Label>
        </div>
        <Button onClick={startMigration} disabled={running || !source}>
          {running ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {dryRun ? "Run Dry Migration" : "Run Live Migration"}
        </Button>
        {migratedCount ? (
          <Link
            href="/hard/auth/customers?source=legacy"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View {migratedCount} legacy customers
          </Link>
        ) : null}
      </div>

      {running && progressPhase ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-foreground">
              Running phase: <span className="capitalize text-primary">{progressPhase}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PHASES.map((phase) => (
                <Badge
                  key={phase}
                  variant={
                    progressPhase === phase
                      ? "default"
                      : PHASES.indexOf(phase) <
                          PHASES.indexOf(progressPhase as (typeof PHASES)[number])
                        ? "secondary"
                        : "outline"
                  }
                  className="capitalize"
                >
                  {phase}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users extracted" value={latestStats.usersExtracted} />
        <Stat label="Users loaded" value={latestStats.usersLoaded} />
        <Stat label="Ledger entries" value={latestStats.ledgerEntriesLoaded} />
        <Stat label="Balance exceptions" value={latestStats.balanceExceptions} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Migration Runs</CardTitle>
          <Button variant="ghost" size="sm" onClick={loadRuns} disabled={loading}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading && runs.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No migration runs yet.</p>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{run.label ?? run.runKey}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString()} · {run.runKey}
                      {run.currentPhase ? ` · phase ${run.currentPhase}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
                    {run.status === "failed" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={running}
                        onClick={() => resumeMigration(run.id)}
                      >
                        Resume
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" onClick={() => loadRunDetail(run.id)}>
                      Details
                    </Button>
                    {!run.dryRun && run.status === "completed" ? (
                      <Button variant="outline" size="sm" onClick={() => rollbackRun(run.id)}>
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
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {selectedRun.errorMessage}
              </p>
            ) : null}
            <pre className="overflow-auto rounded-lg bg-background p-4 text-xs text-foreground/80">
              {JSON.stringify(selectedRun.stats, null, 2)}
            </pre>
            {exceptions.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium text-red-400">
                  Balance Exceptions ({exceptions.length})
                </p>
                <div className="max-h-64 space-y-1 overflow-auto text-xs">
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
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{value ?? "—"}</p>
      </CardContent>
    </Card>
  );
}
