"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  Loader2,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/design-system";
import { shortenAddress } from "@/components/ui/copy-button";
import { getWalletQrUrl } from "@/lib/utils/wallet-qr";
import type { PlatformWalletAdminView } from "@/lib/services/platform-wallet.service";
import { toast } from "sonner";

type WalletFormState = {
  id?: string;
  assetSymbol: string;
  assetName: string;
  network: string;
  walletAddress: string;
  instructions: string;
  displayOrder: string;
  isPrimary: boolean;
  isActive: boolean;
  status: "active" | "inactive" | "archived";
  icon: string;
  color: string;
};

const emptyForm: WalletFormState = {
  assetSymbol: "",
  assetName: "",
  network: "",
  walletAddress: "",
  instructions: "",
  displayOrder: "",
  isPrimary: false,
  isActive: true,
  status: "active",
  icon: "",
  color: "",
};

export function AdminPlatformWalletsManager({ wallets }: { wallets: PlatformWalletAdminView[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewWallet, setPreviewWallet] = useState<PlatformWalletAdminView | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [form, setForm] = useState<WalletFormState>(emptyForm);

  const sorted = useMemo(
    () => [...wallets].sort((a, b) => a.displayOrder - b.displayOrder),
    [wallets],
  );

  function openCreate() {
    setForm(emptyForm);
    setQrFile(null);
    setDialogOpen(true);
  }

  function openEdit(wallet: PlatformWalletAdminView) {
    setForm({
      id: wallet.id,
      assetSymbol: wallet.assetSymbol,
      assetName: wallet.assetName,
      network: wallet.network,
      walletAddress: wallet.walletAddress,
      instructions: wallet.instructions ?? "",
      displayOrder: String(wallet.displayOrder),
      isPrimary: wallet.isPrimary,
      isActive: wallet.isActive,
      status: wallet.status,
      icon: wallet.icon ?? "",
      color: wallet.color ?? "",
    });
    setQrFile(null);
    setDialogOpen(true);
  }

  async function runAction(action: string, id: string) {
    setLoading(`${action}-${id}`);
    try {
      const res = await fetch("/api/hard/auth/platform-wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Action failed");
      }
      toast.success("Wallet updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this wallet? Historical deposits will keep their snapshot.")) return;
    setLoading(`delete-${id}`);
    try {
      const res = await fetch(`/api/hard/auth/platform-wallets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Wallet deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete wallet");
    } finally {
      setLoading(null);
    }
  }

  async function handleSave() {
    setLoading("save");
    try {
      const payload = {
        id: form.id,
        assetSymbol: form.assetSymbol,
        assetName: form.assetName,
        network: form.network,
        walletAddress: form.walletAddress,
        instructions: form.instructions || undefined,
        displayOrder: form.displayOrder ? Number(form.displayOrder) : undefined,
        isPrimary: form.isPrimary,
        isActive: form.isActive,
        status: form.status,
        icon: form.icon || undefined,
        color: form.color || undefined,
      };

      const res = await fetch("/api/hard/auth/platform-wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      const walletId = (form.id ?? data.id) as string;

      if (qrFile && walletId) {
        const fd = new FormData();
        fd.append("qr", qrFile);
        const qrRes = await fetch(`/api/hard/auth/platform-wallets/${walletId}/qr`, {
          method: "POST",
          body: fd,
        });
        if (!qrRes.ok) {
          const err = await qrRes.json();
          throw new Error(err.error ?? "QR upload failed");
        }
      }

      toast.success(form.id ? "Wallet updated" : "Wallet created");
      setDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(null);
    }
  }

  if (!wallets.length) {
    return (
      <div className="space-y-4">
        <Button onClick={openCreate}>Add Platform Wallet</Button>
        <EmptyState
          title="No wallets configured"
          description="Add your first Platform Wallet to enable customer deposits."
        />
        <WalletDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          form={form}
          setForm={setForm}
          setQrFile={setQrFile}
          onSave={handleSave}
          saving={loading === "save"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>Add Platform Wallet</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Asset</TableHead>
              <TableHead className="text-muted-foreground">Network</TableHead>
              <TableHead className="text-muted-foreground">Address</TableHead>
              <TableHead className="text-muted-foreground">Primary</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Order</TableHead>
              <TableHead className="text-muted-foreground">Updated</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((wallet) => (
              <TableRow key={wallet.id} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {wallet.icon ? (
                      <span aria-hidden>{wallet.icon}</span>
                    ) : null}
                    <div>
                      <p className="font-medium text-foreground">{wallet.assetName}</p>
                      <p className="text-xs text-muted-foreground">{wallet.assetSymbol}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-foreground">{wallet.network}</TableCell>
                <TableCell className="font-mono text-xs text-foreground/80">
                  {shortenAddress(wallet.walletAddress)}
                </TableCell>
                <TableCell>
                  {wallet.isPrimary ? (
                    <Badge>Primary</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={wallet.status === "active" ? "default" : "outline"}>
                    {wallet.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground/80">{wallet.displayOrder}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(wallet.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setPreviewWallet(wallet)} title="Preview QR">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(wallet)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={loading === `mark_primary-${wallet.id}`}
                      onClick={() => runAction("mark_primary", wallet.id)}
                      title="Mark primary"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={loading === `duplicate-${wallet.id}`}
                      onClick={() => runAction("duplicate", wallet.id)}
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => runAction("move_up", wallet.id)}
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => runAction("move_down", wallet.id)}
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    {wallet.status === "active" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => runAction("disable", wallet.id)}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => runAction("enable", wallet.id)}
                      >
                        Enable
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={loading === `delete-${wallet.id}`}
                      onClick={() => handleDelete(wallet.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <WalletDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        setQrFile={setQrFile}
        onSave={handleSave}
        saving={loading === "save"}
      />

      <Dialog open={!!previewWallet} onOpenChange={() => setPreviewWallet(null)}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Preview</DialogTitle>
          </DialogHeader>
          {previewWallet ? (
            <div className="space-y-4 text-center">
              <p>
                {previewWallet.assetName} · {previewWallet.network}
              </p>
              {getWalletQrUrl(previewWallet.qrCodePath) ? (
                <Image
                  src={getWalletQrUrl(previewWallet.qrCodePath)!}
                  alt="Wallet QR"
                  width={200}
                  height={200}
                  className="mx-auto rounded border border-input"
                  unoptimized
                />
              ) : (
                <p className="text-muted-foreground text-sm">No QR code uploaded</p>
              )}
              <p className="font-mono text-xs break-all text-foreground/80">
                {previewWallet.walletAddress}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WalletDialog({
  open,
  onOpenChange,
  form,
  setForm,
  setQrFile,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: WalletFormState;
  setForm: (form: WalletFormState) => void;
  setQrFile: (file: File | null) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border text-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit Platform Wallet" : "Add Platform Wallet"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Asset name</Label>
              <Input
                value={form.assetName}
                onChange={(e) => setForm({ ...form, assetName: e.target.value })}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Asset symbol</Label>
              <Input
                value={form.assetSymbol}
                onChange={(e) => setForm({ ...form, assetSymbol: e.target.value })}
                className="bg-background border-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Network</Label>
            <Input
              value={form.network}
              onChange={(e) => setForm({ ...form, network: e.target.value })}
              placeholder="e.g. TRC20, ERC20, BTC"
              className="bg-background border-input"
            />
          </div>
          <div className="space-y-2">
            <Label>Wallet address</Label>
            <Input
              value={form.walletAddress}
              onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
              className="bg-background border-input font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="bg-background border-input"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Icon (emoji, optional)</Label>
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Theme color (optional)</Label>
              <Input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="#3b82f6"
                className="bg-background border-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Display order</Label>
            <Input
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
              className="bg-background border-input"
            />
          </div>
          <div className="space-y-2">
            <Label>QR code (PNG, JPG, WEBP — max 5MB)</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setQrFile(e.target.files?.[0] ?? null)}
              className="bg-background border-input"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-primary"
                checked={form.isPrimary}
                onCheckedChange={(v) => setForm({ ...form, isPrimary: v === true })}
              />
              <Label htmlFor="is-primary">Primary for this asset/network</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-active"
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm({
                    ...form,
                    isActive: v === true,
                    status: v === true ? "active" : "inactive",
                  })
                }
              />
              <Label htmlFor="is-active">Active</Label>
            </div>
          </div>
          <Button onClick={onSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {form.id ? "Save changes" : "Create wallet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
