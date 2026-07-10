import { Suspense } from "react";
import Link from "next/link";
import { AuthLayout, AuthTrustBar } from "@/components/auth/auth-layout";
import { authLinkClass } from "@/components/auth/auth-field";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your investor dashboard."
      panelTitle="Your portfolio, one secure login away"
      panelDescription="Track investments, monitor returns, and manage withdrawals from a single protected dashboard."
      panelImage="/brand/portfolio.jpg"
      panelImageAlt="Investor portal"
      panelHighlights={[
        "Real-time portfolio visibility",
        "Secure withdrawal management",
        "Referral earnings tracking",
        "Dedicated investor support",
      ]}
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className={authLinkClass}>Create free account</Link>
          </p>
          <div className="mt-5"><AuthTrustBar /></div>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
