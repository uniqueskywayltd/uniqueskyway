/** Resolve wallet QR image URL for display (proxy route works without public bucket config). */
export function getWalletQrUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `/api/storage/wallet-qr/${path}`;
}
