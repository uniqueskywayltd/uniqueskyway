"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { AuthField, AuthInputIcon, authLinkClass, authSubmitClass } from "@/components/auth/auth-field";
import { PasswordInput } from "@/components/auth/password-input";
import { FormAlert } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resetSuccess = searchParams.get("reset") === "success";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          rememberMe: form.get("remember") === "on",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to sign in");
        return;
      }

      router.push(data.redirectTo ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {resetSuccess ? (
        <FormAlert variant="success">Password reset successful. You can now sign in.</FormAlert>
      ) : null}

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <AuthField label="Email address" htmlFor="email">
        <AuthInputIcon icon={<Mail className="h-4 w-4" />}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={isLoading}
          />
        </AuthInputIcon>
      </AuthField>

      <AuthField
        label="Password"
        htmlFor="password"
        action={
          <Link href="/forgot-password" className={authLinkClass + " text-xs"}>
            Forgot password?
          </Link>
        }
      >
        <AuthInputIcon icon={<Lock className="h-4 w-4" />}>
          <PasswordInput
            id="password"
            name="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            disabled={isLoading}
            className="border-white/10 bg-white/[0.04] pl-10 text-white placeholder:text-slate-600 focus-visible:border-amber-400/40 focus-visible:ring-amber-400/20"
          />
        </AuthInputIcon>
      </AuthField>

      <div className="flex items-center gap-2.5">
        <Checkbox id="remember" name="remember" disabled={isLoading} className="border-white/20" />
        <label htmlFor="remember" className="text-sm text-slate-400">
          Keep me signed in
        </label>
      </div>

      <Button type="submit" className={authSubmitClass} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-white/5" />}>
      <LoginFormInner />
    </Suspense>
  );
}
