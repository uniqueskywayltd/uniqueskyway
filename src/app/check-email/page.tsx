"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { authLinkClass, authSubmitClass } from "@/components/auth/auth-field";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CheckEmailPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!email) return;
    setLoading(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <AuthLayout
      title="Check your email"
      subtitle="We sent a verification link to your inbox. Click the link to activate your account."
      panelTitle="Almost there"
      panelDescription="Email verification protects your account and ensures only you can access your investor dashboard."
      panelImage="/brand/security.jpg"
      panelImageAlt="Email verification"
      footer={
        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className={authLinkClass}>Back to sign in</Link>
        </p>
      }
    >
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50">
          <Mail className="h-6 w-6 text-amber-600" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Didn&apos;t receive the email? Check spam or resend below.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Your email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {sent ? (
          <p className="text-sm text-emerald-600">If an account exists, a new link has been sent.</p>
        ) : null}
        <Button className={authSubmitClass} onClick={resend} disabled={loading || !email}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Resend verification email
        </Button>
      </div>
    </AuthLayout>
  );
}
