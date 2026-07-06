import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-800 px-6">
          <p className="text-sm text-slate-400">
            Signed in as <span className="text-white">{admin.fullName}</span>
            <span className="ml-2 capitalize text-slate-500">({admin.role.replace("_", " ")})</span>
          </p>
          <form action="/api/auth/logout" method="POST">
            <button className="text-sm text-slate-400 hover:text-white">Sign out</button>
          </form>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
