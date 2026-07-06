import { redirect } from "next/navigation";
import { getCustomerProfile, getSessionUser } from "@/lib/auth/session";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

import { ConfigStatusBanner } from "@/components/dashboard/config-status-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getCustomerProfile(user.authUserId);
  if (!profile) redirect("/login");

  if (!profile.emailVerified && !user.emailVerified) {
    redirect("/verify-email");
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <DashboardNav fullName={profile.fullName} username={profile.username} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 lg:px-8">
          <ConfigStatusBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
