import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { activityFeedService } from "@/lib/services/activity-feed.service";
import { AdminActivityFeedManager } from "@/components/admin/admin-activity-feed-manager";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminActivityFeedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  const [items, config, realCount] = await Promise.all([
    activityFeedService.listAdmin(),
    activityFeedService.getConfig(),
    activityFeedService.countRealActivities(),
  ]);

  if (!items.success) {
    return <ServiceErrorState code={items.error.code} message={items.error.message} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity Feed</h1>
        <p className="text-muted-foreground">
          Manage homepage social proof, seeded data, and pinned announcements
        </p>
      </div>
      <AdminActivityFeedManager
        items={items.data}
        config={config}
        realActivityCount={realCount}
      />
    </div>
  );
}
