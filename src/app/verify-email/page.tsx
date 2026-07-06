import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  const verified = params.verified === "1" || user?.emailVerified;
  const expired = params.error === "expired";

  return (
    <AuthLayout
      title={verified ? "Email verified" : expired ? "Link expired" : "Verify your email"}
      subtitle={
        verified
          ? "Your email has been verified. You now have full access to your dashboard."
          : expired
            ? "This verification link has expired. Request a new one below."
            : "Please verify your email before accessing your investor dashboard."
      }
      panelTitle="Secure your account"
      panelDescription="Verified accounts benefit from full dashboard access, withdrawal capabilities, and security alerts."
      panelImage="/brand/security.jpg"
      panelImageAlt="Account security"
      footer={null}
    >
      <div className="text-center">
        {verified ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        ) : expired ? (
          <XCircle className="mx-auto h-14 w-14 text-destructive" />
        ) : (
          <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-2xl font-semibold">!</div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {verified ? (
            <Link href="/dashboard" className={cn(buttonVariants(), "w-full")}>
              Go to dashboard
            </Link>
          ) : (
            <Link href="/check-email" className={cn(buttonVariants(), "w-full")}>
              Resend verification email
            </Link>
          )}
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
