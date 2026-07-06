import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerProfile, getSessionUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/services/notification.service";
import { PageHeader } from "@/components/design-system/page-header";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { buttonVariants } from "@/components/ui/button";

type SearchParams = Promise<{ page?: string }>;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getCustomerProfile(user.authUserId);
  if (!profile) redirect("/login");

  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const result = await notificationService.listForProfile(profile.id, {
    page,
    pageSize: 20,
  });

  const data = result.success ? result.data : null;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        description="In-app alerts for your account activity."
      />
      <NotificationsPanel items={data?.items ?? []} />

      {data && data.totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          {page > 1 ? (
            <Link
              href={`/dashboard/notifications?page=${page - 1}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Previous
            </Link>
          ) : null}
          {page < data.totalPages ? (
            <Link
              href={`/dashboard/notifications?page=${page + 1}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
