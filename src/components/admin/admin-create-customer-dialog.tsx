"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const EMPTY_FORM = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  referralCode: "",
};

export function AdminCreateCustomerDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/hard/auth/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...form,
          emailVerified: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to create customer");
      }

      toast.success("Customer account created");
      setOpen(false);
      setForm(EMPTY_FORM);
      router.push(`/hard/auth/customers/${data.profileId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="bg-amber-500 text-slate-950 hover:bg-amber-400">
            <UserPlus className="mr-2 h-4 w-4" />
            Create customer
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create customer account</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Admins can create accounts anytime, regardless of public registration settings.
        </p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="create-fullName">Full name</Label>
            <Input
              id="create-fullName"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="create-username">Username</Label>
            <Input
              id="create-username"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="create-password">Temporary password</Label>
            <Input
              id="create-password"
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="create-referral">Referral code (optional)</Label>
            <Input
              id="create-referral"
              value={form.referralCode}
              onChange={(e) => updateField("referralCode", e.target.value)}
            />
          </div>
        </div>
        <Button
          className="w-full"
          disabled={loading || !form.fullName || !form.username || !form.email || !form.password}
          onClick={() => void submit()}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create account
        </Button>
      </DialogContent>
    </Dialog>
  );
}
