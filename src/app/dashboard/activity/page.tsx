import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/auth/session";
import { auditService } from "@/lib/services/audit.service";
import { PageHeader } from "@/components/design-system/page-header";
import { EmptyState } from "@/components/design-system/empty-state";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

type SearchParams = Promise<{ page?: string; category?: string }>;

async function ActivityContent({
  profileId,
  searchParams,
}: {
  profileId: string;
  searchParams: Awaited<SearchParams>;
}) {
  const page = Number(searchParams.page ?? 1);
  const result = await auditService.getTimelineForProfile(
    profileId,
    page,
    30,
    searchParams.category,
  );

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  const { items, totalPages } = result.data;

  if (!items.length) {
    return (
      <EmptyState
        title="No activity yet"
        description="Registration, logins, profile updates, security changes, and financial events will appear here."
        icon={<Activity className="h-5 w-5" />}
      />
    );
  }

  return (
    <>
      <ol className="relative space-y-0 border-l border-border/60 pl-6" role="list">
        {items.map((item) => (
          <li key={item.id} className="relative pb-8 last:pb-0">
            <span className="absolute -left-[25px] flex h-3 w-3 rounded-full bg-primary ring-4 ring-background" aria-hidden />
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs capitalize">
                  {item.category}
                </Badge>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {totalPages > 1 ? (
        <div className="mt-6 flex justify-center gap-2">
          {page > 1 ? (
            <Link href={`/dashboard/activity?page=${page - 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link href={`/dashboard/activity?page=${page + 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  const { profile } = session;

  const params = await searchParams;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Activity timeline"
        description="Unified account history sourced from audit logs."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <ActivityContent profileId={profile.id} searchParams={params} />
      </Suspense>
    </div>
  );
}
