"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Monitor, Shield, Smartphone, Tablet } from "lucide-react";
import { SessionsManager } from "@/components/auth/sessions-manager";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { EmptyState } from "@/components/design-system/empty-state";

type LoginRecord = {
  id: string;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

function DeviceIcon({ ua }: { ua: string | null }) {
  if (!ua) return <Monitor className="h-5 w-5" />;
  if (/mobile/i.test(ua)) return <Smartphone className="h-5 w-5" />;
  if (/tablet|ipad/i.test(ua)) return <Tablet className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

export function SecurityCenter() {
  const [history, setHistory] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/security")
      .then((r) => r.json())
      .then((data) => setHistory(data.loginHistory ?? []))
      .finally(() => setLoading(false));
  }, []);

  const recommendations = [
    !history.some((h) => h.success) && "Complete your first secure login",
    "Use a strong, unique password",
    "Review active sessions regularly",
    "Enable login alerts in notification preferences",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-10">
      {recommendations.length ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900 dark:bg-amber-950/20">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold">Security recommendations</h2>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {recommendations.map((r) => (
              <li key={r} className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                {r}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="max-w-lg">
        <h2 className="text-lg font-semibold">Change password</h2>
        <div className="mt-4 rounded-2xl border border-border/60 bg-card p-6">
          <ChangePasswordForm />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Active sessions & devices</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage devices signed in to your account.
        </p>
        <div className="mt-4">
          <SessionsManager />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Login history</h2>
        <p className="mt-1 text-sm text-muted-foreground">Recent sign-in activity on your account.</p>
        <div className="mt-4 space-y-3">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : history.length === 0 ? (
            <EmptyState
              title="No login history"
              description="Sign-in events will be recorded here."
              icon={<Shield className="h-5 w-5" />}
            />
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <DeviceIcon ua={entry.userAgent} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {entry.success ? "Successful sign-in" : "Failed sign-in attempt"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.ipAddress ?? "Unknown IP"} ·{" "}
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
