import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { investmentAdminService } from "@/lib/services/investment-admin.service";
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
import { formatMoney } from "@/lib/utils/money";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminInvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/admin/login");

  const params = await searchParams;
  const result = await investmentAdminService.listForAdmin({
    page: 1,
    pageSize: 50,
    status: params.status,
    search: params.search,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Investments"
        description="Monitor active positions, maturities, and portfolio performance."
        actions={
          <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Dashboard
          </Link>
        }
      />

      <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Search customer or plan…"
          className={cn(adminInputClass, "max-w-md flex-1")}
        />
        <select name="status" defaultValue={params.status ?? ""} className={adminSelectClass}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="matured">Matured</option>
          <option value="pending">Pending</option>
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
          title="No investments found"
          description="Active and matured investment positions will appear here."
        />
      ) : (
        <DataTable theme="dark">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Customer</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400">Principal</TableHead>
                <TableHead className="text-slate-400">ROI credited</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Matures</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.items.map((inv) => (
                <TableRow key={inv.id} className="border-slate-800">
                  <TableCell className="text-slate-200">{inv.customerName}</TableCell>
                  <TableCell className="text-slate-200">{inv.planName}</TableCell>
                  <TableCell className="font-medium tabular-nums text-white">
                    {formatMoney(inv.principalAmount)}
                  </TableCell>
                  <TableCell className="tabular-nums text-slate-200">
                    {formatMoney(inv.totalRoiCredited)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      theme="dark"
                      status={inv.isPaused ? "pending" : inv.status}
                      label={inv.isPaused ? "paused" : undefined}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {inv.maturesAt ? new Date(inv.maturesAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/investments/${inv.id}`}
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
