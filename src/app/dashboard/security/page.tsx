import { PageHeader } from "@/components/design-system/page-header";
import { SecurityCenter } from "@/components/dashboard/security-center";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Security center"
        description="Manage your password, sessions, and account security."
      />
      <SecurityCenter />
    </div>
  );
}
