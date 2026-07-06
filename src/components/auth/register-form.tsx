"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Gift, Loader2, Lock, Mail, User, UserCircle } from "lucide-react";
import { AuthField, AuthInputIcon, authLinkClass, authSubmitClass } from "@/components/auth/auth-field";
import { ProfilePhotoField } from "@/components/auth/profile-photo-field";
import { PasswordInput } from "@/components/auth/password-input";
import { MathCaptchaField } from "@/components/ui/math-captcha-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isMathCaptchaCorrect, randomMathDigit } from "@/lib/utils/math-captcha";

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "bg-white/10" };
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralFromUrl = searchParams.get("ref") ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [mathA] = useState(() => randomMathDigit());
  const [mathB] = useState(() => randomMathDigit());
  const [mathAnswer, setMathAnswer] = useState("");
  const strength = getPasswordStrength(password);

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
    if (avatarFile) {
      form.set("avatar", avatarFile);
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to create account");
        return;
      }

      router.push(data.redirectTo ?? "/check-email");
    } catch {
      setError("Unable to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
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
            className="border-white/10 bg-white/[0.04] pl-10 text-white placeholder:text-slate-600 focus-visible:border-amber-400/40 focus-visible:ring-amber-400/20"
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
                    i <= strength.score ? strength.color : "bg-white/10",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">{strength.label}</p>
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
            className="border-white/10 bg-white/[0.04] pl-10 text-white placeholder:text-slate-600 focus-visible:border-amber-400/40 focus-visible:ring-amber-400/20"
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

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
        <MathCaptchaField
          a={mathA}
          b={mathB}
          value={mathAnswer}
          onChange={setMathAnswer}
          disabled={isLoading}
          className="text-slate-300 [&_input]:border-white/10 [&_input]:bg-white/[0.04] [&_input]:text-white"
        />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <Checkbox id="terms" name="terms" required disabled={isLoading} className="mt-0.5 border-white/20" />
        <label htmlFor="terms" className="text-sm leading-relaxed text-slate-400">
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
  );
}

export function RegisterForm() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-white/5" />}>
      <RegisterFormInner />
    </Suspense>
  );
}
