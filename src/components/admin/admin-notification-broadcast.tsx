"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function AdminNotificationBroadcast() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });

  async function broadcast() {
    setLoading(true);
    try {
      const res = await fetch("/api/hard/auth/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "broadcast_in_app", ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Broadcast failed");
      toast.success(`Sent to ${data.sent} customers`);
      setForm({ title: "", body: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Broadcast failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="font-semibold">Broadcast in-app notification</h2>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
      </div>
      <Button disabled={loading || !form.title || !form.body} onClick={broadcast}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Broadcast to all customers"}
      </Button>
    </div>
  );
}
