"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { getAvatarUrl, getInitials } from "@/lib/utils/avatar";

type ProfileData = {
  profile: {
    id: string;
    fullName: string;
    email: string;
    username: string;
    phone: string | null;
    country: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    timezone: string | null;
    avatarPath: string | null;
    referralCode: string;
  };
  preferences: {
    locale: string;
    theme: string;
    timezone: string | null;
    marketingEmails: boolean;
    preferredCurrency: string;
  } | null;
  notificationPreferences: {
    emailEnabled: boolean;
    inAppEnabled: boolean;
    loginAlerts: boolean;
    securityAlerts: boolean;
    investmentUpdates: boolean;
    referralUpdates: boolean;
  } | null;
};

export function ProfileForm({
  data,
  appUrl,
  storageAvailable,
}: {
  data: ProfileData;
  appUrl: string;
  storageAvailable: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    fullName: data.profile.fullName,
    phone: data.profile.phone ?? "",
    country: data.profile.country ?? "",
    addressLine1: data.profile.addressLine1 ?? "",
    addressLine2: data.profile.addressLine2 ?? "",
    city: data.profile.city ?? "",
    state: data.profile.state ?? "",
    postalCode: data.profile.postalCode ?? "",
    timezone: data.profile.timezone ?? data.preferences?.timezone ?? "UTC",
    preferredCurrency: data.preferences?.preferredCurrency ?? "USD",
    marketingEmails: data.preferences?.marketingEmails ?? false,
    emailEnabled: data.notificationPreferences?.emailEnabled ?? true,
    inAppEnabled: data.notificationPreferences?.inAppEnabled ?? true,
    loginAlerts: data.notificationPreferences?.loginAlerts ?? true,
    securityAlerts: data.notificationPreferences?.securityAlerts ?? true,
    investmentUpdates: data.notificationPreferences?.investmentUpdates ?? true,
    referralUpdates: data.notificationPreferences?.referralUpdates ?? true,
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            fullName: form.fullName,
            phone: form.phone || undefined,
            country: form.country || undefined,
            addressLine1: form.addressLine1 || undefined,
            addressLine2: form.addressLine2 || undefined,
            city: form.city || undefined,
            state: form.state || undefined,
            postalCode: form.postalCode || undefined,
            timezone: form.timezone,
          },
          preferences: {
            timezone: form.timezone,
            preferredCurrency: form.preferredCurrency,
            marketingEmails: form.marketingEmails,
          },
          notificationPreferences: {
            emailEnabled: form.emailEnabled,
            inAppEnabled: form.inAppEnabled,
            loginAlerts: form.loginAlerts,
            securityAlerts: form.securityAlerts,
            investmentUpdates: form.investmentUpdates,
            referralUpdates: form.referralUpdates,
          },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Profile updated");
      router.refresh();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/dashboard/profile", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Upload failed");
      }
      toast.success("Photo updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const initials = getInitials(data.profile.fullName);
  const referralLink = `${appUrl}/register?ref=${encodeURIComponent(data.profile.referralCode)}`;

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="text-lg font-semibold">Profile photo</h2>
        <div className="mt-4 flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={getAvatarUrl(data.profile.avatarPath)} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleAvatarChange}
              aria-label="Upload profile photo"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || !storageAvailable}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload photo
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              {storageAvailable
                ? "JPEG, PNG, WebP or GIF. Max 5MB."
                : "Avatar uploads require Supabase Storage configuration (SUPABASE_SERVICE_ROLE_KEY)."}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Personal information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={data.profile.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={`@${data.profile.username}`} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Address</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input
              id="addressLine1"
              value={form.addressLine1}
              onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input
              id="addressLine2"
              value={form.addressLine2}
              onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State / Province</Label>
            <Input
              id="state"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal code</Label>
            <Input
              id="postalCode"
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Preferences</h2>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            placeholder="America/Chicago"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredCurrency">Preferred currency</Label>
          <Input
            id="preferredCurrency"
            value={form.preferredCurrency}
            onChange={(e) => setForm({ ...form, preferredCurrency: e.target.value.toUpperCase() })}
            placeholder="USD"
            maxLength={3}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="marketingEmails"
            checked={form.marketingEmails}
            onCheckedChange={(c) => setForm({ ...form, marketingEmails: c === true })}
          />
          <Label htmlFor="marketingEmails">Receive marketing emails</Label>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Notification preferences</h2>
        {(
          [
            ["emailEnabled", "Email notifications"],
            ["inAppEnabled", "In-app notifications"],
            ["loginAlerts", "Login alerts"],
            ["securityAlerts", "Security alerts"],
            ["investmentUpdates", "Investment updates"],
            ["referralUpdates", "Referral updates"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              id={key}
              checked={form[key]}
              onCheckedChange={(c) => setForm({ ...form, [key]: c === true })}
            />
            <Label htmlFor={key}>{label}</Label>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Referrals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your code or link. New members enter it when they sign up.
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your referral code
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-lg font-semibold tracking-wide">{data.profile.referralCode}</p>
            <CopyButton value={data.profile.referralCode} label="Copy code" />
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Share link
          </p>
          <p className="mt-2 break-all font-mono text-sm">{referralLink}</p>
          <div className="mt-3">
            <CopyButton value={referralLink} label="Copy link" />
          </div>
        </div>
      </section>

      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  );
}
