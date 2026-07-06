import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";
import { paymentMethodService } from "@/lib/services/payment-method.service";
import { AdminPaymentMethodsManager } from "@/components/admin/admin-payment-methods-manager";
import { ServiceErrorState } from "@/components/dashboard/service-error-state";

export default async function AdminPaymentMethodsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/admin/login");

  const result = await paymentMethodService.listAllAdmin();

  if (!result.success) {
    return <ServiceErrorState code={result.error.code} message={result.error.message} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payment Method Management</h1>
        <p className="text-slate-400">Configure deposit methods, wallet addresses, and bank accounts</p>
      </div>
      <AdminPaymentMethodsManager methods={result.data} />
    </div>
  );
}
