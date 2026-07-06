"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { AuthField, AuthInputIcon, authLinkClass, authSubmitClass } from "@/components/auth/auth-field";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirm = form.get("confirmPassword") as string;

    if (password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to reset password");
        return;
      }
      router.push(data.redirectTo ?? "/login?reset=success");
    } catch {
      setError("Unable to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your Unique Sky Way account."
      panelTitle="Account recovery"
      panelDescription="Use a unique password you don't use on other sites."
      panelImage="/brand/security.jpg"
      panelImageAlt="Password reset"
      footer={
        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className={authLinkClass}>Back to sign in</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <AuthField label="New password" htmlFor="password">
          <AuthInputIcon icon={<Lock className="h-4 w-4" />}>
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={8}
              disabled={loading}
              className="pl-10"
            />
          </AuthInputIcon>
        </AuthField>

        <AuthField label="Confirm password" htmlFor="confirmPassword">
          <AuthInputIcon icon={<Lock className="h-4 w-4" />}>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={8}
              disabled={loading}
              className="pl-10"
            />
          </AuthInputIcon>
        </AuthField>

        <Button type="submit" className={authSubmitClass} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
