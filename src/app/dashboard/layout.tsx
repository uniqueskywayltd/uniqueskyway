import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner";
import { ConfigStatusBanner } from "@/components/dashboard/config-status-banner";
import { EmailVerifiedBanner } from "@/components/dashboard/email-verified-banner";
import { InactivityGuard } from "@/components/auth/inactivity-guard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDashboardSession();
  if (!session) redirect("/login");

  const { user, profile, impersonating } = session;

  if (!impersonating && !profile.emailVerified && !user.emailVerified) {
    redirect(`/register?verify=1&email=${encodeURIComponent(profile.email)}`);
  }

  return (
    <DashboardShell
      fullName={profile.fullName}
      username={profile.username}
      avatarPath={profile.avatarPath}
    >
      <InactivityGuard logoutUrl="/api/auth/logout?reason=inactivity" />
      <Suspense fallback={null}>
        <EmailVerifiedBanner />
      </Suspense>
      {impersonating ? <ImpersonationBanner customerName={profile.fullName} /> : null}
      <ConfigStatusBanner />
      {children}
    </DashboardShell>
  );
}
