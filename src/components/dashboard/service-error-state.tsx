import { isInfrastructureError } from "@/lib/infrastructure";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/design-system/empty-state";

type ServiceErrorStateProps = {
  code?: string;
  message?: string;
};

export function ServiceErrorState({ code, message }: ServiceErrorStateProps) {
  if (code && isInfrastructureError(code)) {
    return (
      <EmptyState
        title="Financial data unavailable"
        description="DATABASE_URL is not configured. Configure your environment to load live ledger data. Metrics will show zero until connected."
        icon={<AlertTriangle className="h-5 w-5" />}
      />
    );
  }

  return (
    <EmptyState
      title="Unable to load data"
      description={message ?? "An error occurred while loading this section."}
      icon={<AlertTriangle className="h-5 w-5" />}
    />
  );
}
