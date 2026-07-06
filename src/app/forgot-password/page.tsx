"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { AuthField, AuthInputIcon, authLinkClass, authSubmitClass } from "@/components/auth/auth-field";
import { AuthLayout, AuthTrustBar } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });

    setSent(true);
    setLoading(false);
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a secure reset link."
      panelTitle="Account recovery"
      panelDescription="For your security, reset links expire after a short period."
      panelImage="/brand/security.jpg"
      panelImageAlt="Password recovery"
      footer={
        <>
          <p className="text-center text-sm text-slate-500">
            <Link href="/login" className={authLinkClass}>Back to sign in</Link>
          </p>
          <div className="mt-5"><AuthTrustBar /></div>
        </>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-800">
          If an account exists with that email, you will receive a password reset link shortly.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField label="Email address" htmlFor="email">
            <AuthInputIcon icon={<Mail className="h-4 w-4" />}>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </AuthInputIcon>
          </AuthField>
          <Button type="submit" className={authSubmitClass} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
