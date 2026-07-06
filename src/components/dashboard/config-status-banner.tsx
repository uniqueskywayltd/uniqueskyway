import { AlertTriangle } from "lucide-react";
import { getIntegrationStatus } from "@/lib/infrastructure";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ConfigStatusBanner() {
  const status = getIntegrationStatus();

  if (status.ready && status.storage && status.email) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        Infrastructure setup pending
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <p className="mt-1">
          Some integrations are not configured. Affected features are disabled; the rest of the app
          remains operational.
        </p>
        <ul className="mt-2 list-inside list-disc text-sm">
          {!status.supabase ? (
            <li>
              <strong>Supabase</strong> — set NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </li>
          ) : null}
          {!status.database ? (
            <li>
              <strong>Database</strong> — set DATABASE_URL
            </li>
          ) : null}
          {!status.storage ? (
            <li>
              <strong>Storage</strong> — set SUPABASE_SERVICE_ROLE_KEY for avatar uploads
            </li>
          ) : null}
          {!status.email ? (
            <li>
              <strong>Email</strong> — set RESEND_API_KEY for transactional email
            </li>
          ) : null}
        </ul>
        <p className="mt-2 text-xs opacity-80">
          Check <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">/api/health</code>{" "}
          for live integration status.
        </p>
      </AlertDescription>
    </Alert>
  );
}
