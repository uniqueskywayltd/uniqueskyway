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
import { Badge } from "@/components/ui/badge";
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
import { AdminCreateCustomerDialog } from "@/components/admin/admin-create-customer-dialog";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; source?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const params = await searchParams;
  const legacyOnly = params.source === "legacy";
  const result = await customerAdminService.listForAdmin({
    page: 1,
    pageSize: 50,
    search: params.search,
    status: params.status,
    legacyOnly,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer management"
        description={
          legacyOnly
            ? "Showing legacy migrated investor accounts only."
            : "Search, review, and manage investor accounts."
        }
        actions={<AdminCreateCustomerDialog />}
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/hard/auth/customers"
          className={cn(buttonVariants({ variant: legacyOnly ? "outline" : "default", size: "sm" }))}
        >
          All customers
        </Link>
        <Link
          href="/hard/auth/customers?source=legacy"
          className={cn(buttonVariants({ variant: legacyOnly ? "default" : "outline", size: "sm" }))}
        >
          Legacy migrated
        </Link>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {legacyOnly ? <input type="hidden" name="source" value="legacy" /> : null}
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
          title="No customers found"
          description="Try adjusting your search or status filters."
          hint="New registrations will appear here once accounts are created."
        />
      ) : (
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Customer</TableHead>
                <TableHead className="text-muted-foreground">Username</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Investments</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.items.map((c) => (
                <TableRow key={c.id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <Link
                      href={`/hard/auth/customers/${c.id}`}
                      className="block rounded-md -m-1 p-1 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground underline-offset-2 hover:underline">
                          {c.fullName}
                        </p>
                        {c.legacyUserId ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Legacy #{c.legacyUserId}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </Link>
                  </TableCell>
                  <TableCell className="text-foreground">
                    <Link
                      href={`/hard/auth/customers/${c.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      @{c.username}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={c.loginDisabled ? "suspended" : c.status}
                      label={c.loginDisabled ? "login disabled" : undefined}
                    />
                  </TableCell>
                  <TableCell className="tabular-nums text-foreground">{c.activeInvestments}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/hard/auth/customers/${c.id}`}
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
