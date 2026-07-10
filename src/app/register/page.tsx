import { Suspense } from "react";
import Link from "next/link";
import { AuthLayout, AuthTrustBar } from "@/components/auth/auth-layout";
import { authLinkClass } from "@/components/auth/auth-field";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Open a free Unique Sky Way investor account in minutes."
      panelTitle="Start building your investment portfolio"
      panelDescription="Join investors who value transparency, security, and disciplined portfolio growth."
      panelImage="/brand/portfolio.jpg"
      panelImageAlt="Start investing"
      panelHighlights={[
        "Free investor account setup",
        "Enterprise-grade authentication",
        "Transparent transaction history",
        "Professional support team",
      ]}
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className={authLinkClass}>Sign in</Link>
          </p>
          <div className="mt-5"><AuthTrustBar /></div>
        </>
      }
    >
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
