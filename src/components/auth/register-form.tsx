"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Gift, Loader2, Lock, Mail, User, UserCircle } from "lucide-react";
import { AuthField, AuthInputIcon, authLinkClass, authSubmitClass } from "@/components/auth/auth-field";
import { EmailVerificationModal } from "@/components/auth/email-verification-modal";
import { ProfilePhotoField } from "@/components/auth/profile-photo-field";
import { PasswordInput } from "@/components/auth/password-input";
import { MathCaptchaField } from "@/components/ui/math-captcha-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isMathCaptchaCorrect, randomMathDigit } from "@/lib/utils/math-captcha";

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "bg-muted" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 3) return { score: 2, label: "Fair", color: "bg-amber-500" };
  return { score: 3, label: "Strong", color: "bg-emerald-500" };
}

function RegisterFormInner() {
  const searchParams = useSearchParams();
  const referralFromUrl = searchParams.get("ref") ?? "";
  const verifyFromUrl = searchParams.get("verify") === "1";
  const verifiedFromUrl = searchParams.get("verified") === "1";
  const emailFromUrl = searchParams.get("email") ?? "";
  const verifyError = searchParams.get("verify_error");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [mathA] = useState(() => randomMathDigit());
  const [mathB] = useState(() => randomMathDigit());
  const [mathAnswer, setMathAnswer] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const strength = getPasswordStrength(password);

  useEffect(() => {
    if ((verifyFromUrl || verifiedFromUrl) && emailFromUrl) {
      setVerifyEmail(emailFromUrl);
      setVerifyModalOpen(true);
    }
  }, [verifyFromUrl, verifiedFromUrl, emailFromUrl]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isMathCaptchaCorrect(mathA, mathB, mathAnswer)) {
      setError("Incorrect answer");
      setIsLoading(false);
      return;
    }

    const form = new FormData(e.currentTarget);
    form.set("mathA", String(mathA));
    form.set("mathB", String(mathB));
    form.set("mathAnswer", mathAnswer);
    if (termsAccepted) {
      form.set("terms", "on");
    }
    if (avatarFile) {
      form.set("avatar", avatarFile);
    }

    const submittedEmail = String(form.get("email") ?? "").trim();

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Unable to create account. Please try again later.");
        return;
      }

      setVerifyEmail(data.email ?? submittedEmail);
      setVerifyModalOpen(true);
    } catch {
      setError("Unable to create account. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <AuthField label="Full name" htmlFor="name">
          <AuthInputIcon icon={<User className="h-4 w-4" />}>
            <Input id="name" name="name" placeholder="John Smith" autoComplete="name" required disabled={isLoading} />
          </AuthInputIcon>
        </AuthField>

        <AuthField label="Username" htmlFor="username">
          <AuthInputIcon icon={<UserCircle className="h-4 w-4" />}>
            <Input
              id="username"
              name="username"
              placeholder="johnsmith"
              autoComplete="username"
              pattern="[a-zA-Z0-9_]{3,24}"
              required
              disabled={isLoading}
            />
          </AuthInputIcon>
        </AuthField>

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

        <AuthField label="Password" htmlFor="password">
          <AuthInputIcon icon={<Lock className="h-4 w-4" />}>
            <PasswordInput
              id="password"
              name="password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
            />
          </AuthInputIcon>
          {password ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i <= strength.score ? strength.color : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{strength.label}</p>
            </div>
          ) : null}
        </AuthField>

        <AuthField label="Confirm password" htmlFor="confirmPassword">
          <AuthInputIcon icon={<Lock className="h-4 w-4" />}>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={isLoading}
              className="pl-10"
              onChange={(e) => {
                e.target.setCustomValidity(e.target.value !== password ? "Passwords do not match" : "");
              }}
            />
          </AuthInputIcon>
        </AuthField>

        <AuthField label="Referral code" htmlFor="referral">
          <AuthInputIcon icon={<Gift className="h-4 w-4" />}>
            <Input
              id="referral"
              name="referral"
              placeholder="Optional"
              defaultValue={referralFromUrl}
              autoComplete="off"
              disabled={isLoading}
            />
          </AuthInputIcon>
        </AuthField>

        <ProfilePhotoField disabled={isLoading} onChange={setAvatarFile} />

        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
          <MathCaptchaField
            a={mathA}
            b={mathB}
            value={mathAnswer}
            onChange={setMathAnswer}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            required
            disabled={isLoading}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground">
            I agree to the{" "}
            <Link href="/terms" className={authLinkClass}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className={authLinkClass}>
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        <Button type="submit" className={authSubmitClass} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <EmailVerificationModal
        open={verifyModalOpen}
        email={verifyEmail}
        onOpenChange={setVerifyModalOpen}
        type="signup"
        startConfirmed={verifiedFromUrl}
        errorMessage={
          verifyError === "expired"
            ? "Your verification link expired. Enter a new code or resend."
            : verifyError === "invalid"
              ? "Invalid verification link. Enter the code from your email."
              : null
        }
      />
    </>
  );
}

export function RegisterForm() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
      <RegisterFormInner />
    </Suspense>
  );
}
