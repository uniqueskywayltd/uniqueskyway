import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { customerAdminService } from "@/lib/services/customer-admin.service";
import {
  AdminPageHeader,
  DataTable,
  EmptyState,
  StatusBadge,
  adminInputClass,
  adminSelectClass,
} from "@/components/design-system";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/admin/login");

  const params = await searchParams;
  const result = await customerAdminService.listForAdmin({
    page: 1,
    pageSize: 50,
    search: params.search,
    status: params.status,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer management"
        description="Search, review, and manage investor accounts."
      />

      <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Search name, email, username…"
          className={cn(adminInputClass, "max-w-md flex-1")}
        />
        <select name="status" defaultValue={params.status ?? ""} className={adminSelectClass}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending_verification">Pending verification</option>
        </select>
        <button type="submit" className={buttonVariants({ size: "sm" })}>
          Filter
        </button>
      </form>

      {!result.success ? (
        <ServiceErrorState code={result.error.code} message={result.error.message} />
      ) : result.data.items.length === 0 ? (
        <EmptyState
          theme="dark"
          title="No customers found"
          description="Try adjusting your search or status filters."
          hint="New registrations will appear here once accounts are created."
        />
      ) : (
        <DataTable theme="dark">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Customer</TableHead>
                <TableHead className="text-slate-400">Username</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Investments</TableHead>
                <TableHead className="text-slate-400">Joined</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.items.map((c) => (
                <TableRow key={c.id} className="border-slate-800">
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{c.fullName}</p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-200">@{c.username}</TableCell>
                  <TableCell>
                    <StatusBadge
                      theme="dark"
                      status={c.loginDisabled ? "suspended" : c.status}
                      label={c.loginDisabled ? "login disabled" : undefined}
                    />
                  </TableCell>
                  <TableCell className="tabular-nums text-slate-200">{c.activeInvestments}</TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTable>
      )}
    </div>
  );
}
