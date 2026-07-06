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
  if (!user) redirect("/admin/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/admin/login");

  const deliveries = await notificationService.listAdminDeliveries(1, 30);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Notification Management</h1>
        <p className="text-slate-400">Broadcast and monitor delivery status</p>
      </div>

      <AdminNotificationBroadcast />

      {deliveries.success ? (
        <div>
          <h2 className="mb-4 font-semibold">Recent deliveries</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Time</TableHead>
                  <TableHead className="text-slate-400">Title</TableHead>
                  <TableHead className="text-slate-400">Channel</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.data.items.map((n) => (
                  <TableRow key={n.id} className="border-slate-800">
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
