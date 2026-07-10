import { redirect } from "next/navigation";
import { AUTH_ROUTES, DASHBOARD_PREFIX } from "@/lib/auth/constants";

export default async function VerifyEmailRedirect({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; verified?: string }>;
}) {
  const params = await searchParams;

  if (params.verified === "1") {
    redirect(`${DASHBOARD_PREFIX}?verified=1`);
  }

  const query = new URLSearchParams();
  query.set("verify", "1");
  if (params.email) query.set("email", params.email);
  if (params.error === "expired") query.set("verify_error", "expired");
  if (params.error === "invalid") query.set("verify_error", "invalid");
  redirect(`${AUTH_ROUTES.register}?${query.toString()}`);
}
