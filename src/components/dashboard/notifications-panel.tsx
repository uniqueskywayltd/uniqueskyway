"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/design-system/empty-state";
import type { NotificationView } from "@/lib/services/notification.service";

type NotificationsPanelProps = {
  items: NotificationView[];
  showMarkAll?: boolean;
};

export function NotificationsPanel({
  items,
  showMarkAll = true,
}: NotificationsPanelProps) {
  const router = useRouter();

  async function markRead(id: string) {
    await fetch("/api/dashboard/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", notificationId: id }),
    });
    router.refresh();
  }

  async function markAllRead() {
    await fetch("/api/dashboard/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "readAll" }),
    });
    router.refresh();
  }

  async function archive(id: string) {
    await fetch("/api/dashboard/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive", notificationId: id }),
    });
    router.refresh();
  }

  if (!items.length) {
    return (
      <EmptyState
        title="No notifications"
        description="You're all caught up. New alerts will appear here."
        icon={<Bell className="h-5 w-5" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {showMarkAll ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      ) : null}

      <ul className="space-y-3" role="list">
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border border-border/60 bg-card p-4 ${
              !n.readAt ? "border-l-4 border-l-primary" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{n.title}</p>
                  {!n.readAt ? (
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()} · {n.eventType}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!n.readAt ? (
                  <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                    Read
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" onClick={() => archive(n.id)}>
                  Archive
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
