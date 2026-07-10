"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, PartyPopper } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authSubmitClass } from "@/components/auth/auth-field";

type EmailVerificationModalProps = {
  open: boolean;
  email: string;
  onOpenChange?: (open: boolean) => void;
  type?: "signup" | "verify";
  errorMessage?: string | null;
  /** When true, skip OTP and show account-ready confirmation (e.g. after email link). */
  startConfirmed?: boolean;
  redirectTo?: string;
};

export function EmailVerificationModal({
  open,
  email,
  onOpenChange,
  type = "signup",
  errorMessage = null,
  startConfirmed = false,
  redirectTo = "/dashboard",
}: EmailVerificationModalProps) {
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"input" | "success">(startConfirmed ? "success" : "input");
  const [error, setError] = useState<string | null>(errorMessage);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!open) {
      setOtp("");
      setStatus(startConfirmed ? "success" : "input");
      setError(errorMessage);
      return;
    }
    if (startConfirmed) {
      setStatus("success");
    }
  }, [open, errorMessage, startConfirmed]);

  function continueToDashboard() {
    window.location.assign(redirectTo);
  }

  async function verify() {
    if (!email || !otp.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, otp: otp.trim(), type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Invalid verification code");
        return;
      }
      setStatus("success");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email) return;
    setResending(true);
    setError(null);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={status === "input"} className="sm:max-w-md">
        {status === "success" ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="relative">
              <CheckCircle2 className="h-14 w-14 text-emerald-500" />
              <PartyPopper className="absolute -right-2 -top-1 h-5 w-5 text-primary" />
            </div>
            <DialogHeader className="mt-4 items-center text-center">
              <DialogTitle className="text-xl">Account created successfully!</DialogTitle>
              <DialogDescription className="text-center">
                Your email is verified and your investor account is ready. Continue to sign in to
                your dashboard when you&apos;re ready.
              </DialogDescription>
            </DialogHeader>
            <Button
              type="button"
              className={`${authSubmitClass} mt-6`}
              onClick={continueToDashboard}
            >
              Continue to dashboard
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-center text-lg">Verify your email</DialogTitle>
              <DialogDescription className="text-center">
                Your account was created. Enter the code sent to{" "}
                <span className="font-medium text-foreground">{email}</span> to activate it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
                disabled={loading}
                className="h-12 text-center font-mono text-lg tracking-[0.35em]"
                maxLength={8}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void verify();
                  }
                }}
              />

              {error ? (
                <p className="text-center text-sm text-destructive">{error}</p>
              ) : null}

              <Button
                type="button"
                className={authSubmitClass}
                disabled={loading || otp.trim().length < 4}
                onClick={() => void verify()}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify email
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Or use the link in your email
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mx-auto w-full"
                disabled={resending}
                onClick={() => void resend()}
              >
                {resending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                Resend code
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
