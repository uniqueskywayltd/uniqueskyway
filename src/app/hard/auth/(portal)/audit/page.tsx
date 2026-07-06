import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { adminAuditService } from "@/lib/services/admin-audit.service";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminAuditPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const result = await adminAuditService.list({ page: 1, pageSize: 50 });

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Center</h1>
        <p className="text-slate-400">Immutable audit trail — export-ready architecture</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Timestamp</TableHead>
              <TableHead className="text-slate-400">Actor</TableHead>
              <TableHead className="text-slate-400">Action</TableHead>
              <TableHead className="text-slate-400">Target</TableHead>
              <TableHead className="text-slate-400">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.items.map((log) => (
              <TableRow key={log.id} className="border-slate-800">
                <TableCell className="text-sm">{new Date(log.createdAt).toLocaleString()}</TableCell>
                <TableCell>{log.actorName ?? "System"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{log.action}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-slate-400">{log.entityType}</span>
                  {log.entityId ? (
                    <span className="ml-2 font-mono text-xs">{log.entityId.slice(0, 8)}</span>
                  ) : null}
                </TableCell>
                <TableCell className="font-mono text-xs">{log.ipAddress ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
