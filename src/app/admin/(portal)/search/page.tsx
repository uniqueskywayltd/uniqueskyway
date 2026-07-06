import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { AdminGlobalSearch } from "@/components/admin/admin-global-search";

export default async function AdminSearchPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/admin/login");

  return <AdminGlobalSearch />;
}
