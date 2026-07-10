import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { MigrationDashboard } from "@/components/admin/migration-dashboard";
import { migrationOrchestratorService } from "@/lib/services/migration/migration-orchestrator.service";

export default async function AdminMigrationPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");

  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  if (admin.role !== "super_admin") {
    redirect("/hard/auth");
  }

  const runsResult = await migrationOrchestratorService.listRuns();
  const previewResult = migrationOrchestratorService.getSourcePreview();
  const initialRuns = runsResult.success
    ? runsResult.data.map((run) => ({
        ...run,
        createdAt: run.createdAt.toISOString(),
      }))
    : [];
  const initialSource = previewResult.success ? previewResult.data : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Legacy Migration</h1>
        <p className="text-muted-foreground">
          ETL pipeline for migrating customers, financial records, and profile images from the
          legacy PHP platform.
        </p>
      </div>
      <MigrationDashboard initialRuns={initialRuns} initialSource={initialSource} />
    </div>
  );
}
