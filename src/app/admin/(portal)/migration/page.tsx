import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { MigrationDashboard } from "@/components/admin/migration-dashboard";
import { migrationOrchestratorService } from "@/lib/services/migration/migration-orchestrator.service";

export default async function AdminMigrationPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/admin/login");

  if (admin.role !== "super_admin") {
    redirect("/admin");
  }

  const runsResult = await migrationOrchestratorService.listRuns();
  const initialRuns = runsResult.success
    ? runsResult.data.map((run) => ({
        ...run,
        createdAt: run.createdAt.toISOString(),
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Legacy Migration</h1>
        <p className="text-slate-400">
          ETL pipeline for migrating customers, financial records, and profile images from the
          legacy PHP platform.
        </p>
      </div>
      <MigrationDashboard initialRuns={initialRuns} />
    </div>
  );
}
