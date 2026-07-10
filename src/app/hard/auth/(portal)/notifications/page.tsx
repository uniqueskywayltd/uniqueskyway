import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/services/notification.service";
import { AdminNotificationBroadcast } from "@/components/admin/admin-notification-broadcast";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminNotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const deliveries = await notificationService.listAdminDeliveries(1, 30);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Notification Management</h1>
        <p className="text-muted-foreground">Broadcast and monitor delivery status</p>
      </div>

      <AdminNotificationBroadcast />

      {deliveries.success ? (
        <div>
          <h2 className="mb-4 font-semibold">Recent deliveries</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Time</TableHead>
                  <TableHead className="text-muted-foreground">Title</TableHead>
                  <TableHead className="text-muted-foreground">Channel</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.data.items.map((n) => (
                  <TableRow key={n.id} className="border-border">
                    <TableCell className="text-sm">{new Date(n.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{n.title}</TableCell>
                    <TableCell className="capitalize">{n.eventType.split(".")[0]}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{n.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
