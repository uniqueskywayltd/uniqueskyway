"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { AuthField, AuthInputIcon, authLinkClass, authSubmitClass } from "@/components/auth/auth-field";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/hard/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : { error: res.ok ? undefined : "Unable to sign in" };

      if (!res.ok) {
        setError(data.error ?? "Invalid credentials");
        return;
      }

      window.location.assign(data.redirectTo ?? "/hard/auth");
    } catch {
      setError("Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Admin sign in"
      subtitle="Restricted access for authorized personnel only."
      panelTitle="Administration portal"
      panelDescription="Role-based access control ensures only authorized staff can manage platform operations."
      panelImage="/brand/corporate.jpg"
      panelImageAlt="Admin portal"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className={authLinkClass}>Back to website</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <AuthField label="Admin email" htmlFor="email">
          <AuthInputIcon icon={<Mail className="h-4 w-4" />}>
            <Input id="email" name="email" type="email" required disabled={loading} />
          </AuthInputIcon>
        </AuthField>

        <AuthField label="Password" htmlFor="password">
          <AuthInputIcon icon={<Lock className="h-4 w-4" />}>
            <PasswordInput
              id="password"
              name="password"
              required
              disabled={loading}
              className="pl-10"
            />
          </AuthInputIcon>
        </AuthField>

        <Button type="submit" className={authSubmitClass} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign in to admin
        </Button>
      </form>
    </AuthLayout>
  );
}
