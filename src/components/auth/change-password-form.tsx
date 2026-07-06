"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { AuthField, AuthInputIcon } from "@/components/auth/auth-field";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          password: form.get("password"),
          confirmPassword: form.get("confirmPassword"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to change password");
        return;
      }
      setMessage("Password updated successfully.");
      e.currentTarget.reset();
    } catch {
      setError("Unable to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <AuthField label="Current password" htmlFor="currentPassword">
        <AuthInputIcon icon={<Lock className="h-4 w-4" />}>
          <PasswordInput id="currentPassword" name="currentPassword" required disabled={loading} />
        </AuthInputIcon>
      </AuthField>

      <AuthField label="New password" htmlFor="password">
        <AuthInputIcon icon={<Lock className="h-4 w-4" />}>
          <PasswordInput id="password" name="password" required minLength={8} disabled={loading} />
        </AuthInputIcon>
      </AuthField>

      <AuthField label="Confirm new password" htmlFor="confirmPassword">
        <AuthInputIcon icon={<Lock className="h-4 w-4" />}>
          <PasswordInput id="confirmPassword" name="confirmPassword" required minLength={8} disabled={loading} />
        </AuthInputIcon>
      </AuthField>

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Update password
      </Button>
    </form>
  );
}
