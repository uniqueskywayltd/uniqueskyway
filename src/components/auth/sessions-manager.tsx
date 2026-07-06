"use client";

import { useEffect, useState } from "react";
import { Loader2, Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Session = {
  id: string;
  browser: string;
  os: string;
  deviceLabel: string | null;
  ipAddress: string | null;
  lastActiveAt: string | null;
  isCurrent: boolean;
};

function DeviceIcon({ label }: { label: string | null }) {
  if (label === "mobile") return <Smartphone className="h-5 w-5" />;
  if (label === "tablet") return <Tablet className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

export function SessionsManager() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/sessions")
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function revoke(id: string) {
    await fetch(`/api/auth/sessions?id=${id}`, { method: "DELETE" });
    router.refresh();
    setSessions((s) => s.filter((x) => x.id !== id));
  }

  async function revokeAll() {
    await fetch("/api/auth/sessions?all=true", { method: "DELETE" });
    router.push("/login");
  }

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <DeviceIcon label={session.deviceLabel} />
            </div>
            <div>
              <p className="font-medium">
                {session.browser} on {session.os}
                {session.isCurrent ? (
                  <span className="ml-2 text-xs text-emerald-600">Current</span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.ipAddress ?? "Unknown IP"} ·{" "}
                {session.lastActiveAt
                  ? new Date(session.lastActiveAt).toLocaleString()
                  : "Unknown"}
              </p>
            </div>
          </div>
          {!session.isCurrent ? (
            <Button variant="outline" size="sm" onClick={() => revoke(session.id)}>
              Revoke
            </Button>
          ) : null}
        </div>
      ))}

      {sessions.length > 1 ? (
        <Button variant="destructive" onClick={revokeAll}>
          Sign out all devices
        </Button>
      ) : null}
    </div>
  );
}
