import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/auth/session";
import { profileService } from "@/lib/services/profile.service";
import { isStorageConfigured, resolveAppUrl } from "@/lib/env";
import { PageHeader } from "@/components/design-system/page-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function ProfilePage() {
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  const { profile } = session;

  const data = await profileService.getFullProfile(profile.id);
  if (!data) {
    return (
      <div className="max-w-3xl space-y-6">
        <PageHeader title="Profile" description="Manage your personal information and preferences." />
        <ServiceErrorState message="Unable to load profile. Database may not be configured." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your personal information and preferences."
      />
      <ProfileForm
        data={data}
        appUrl={resolveAppUrl()}
        storageAvailable={isStorageConfigured()}
      />
    </div>
  );
}
