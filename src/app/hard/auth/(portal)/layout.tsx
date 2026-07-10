import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { InactivityGuard } from "@/components/auth/inactivity-guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");

  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  return (
    <div className="min-h-dvh bg-background text-foreground lg:flex">
      <InactivityGuard logoutUrl="/api/hard/auth/logout?reason=inactivity" />
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader fullName={admin.fullName} role={admin.role} />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
