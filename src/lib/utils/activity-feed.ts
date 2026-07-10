import type { ActivityFeedItem } from "@/lib/constants/trust-components";

/** Mask a full name to "First L." format for public display */
export function maskCustomerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Member";
  const first = parts[0]!;
  if (parts.length === 1) {
    return first.length > 1 ? `${first.charAt(0).toUpperCase()}${first.slice(1)}.` : `${first}.`;
  }
  const lastInitial = parts[parts.length - 1]!.charAt(0).toUpperCase();
  const formattedFirst =
    first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  return `${formattedFirst} ${lastInitial}.`;
}

export function relativeTimeLabel(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function activitySubjectKey(item: {
  subjectKey?: string | null;
  customerNameMasked?: string | null;
  id: string;
}): string {
  return item.subjectKey ?? item.customerNameMasked ?? item.id;
}

/** Pick the next feed item, respecting per-person cooldown and type variety. */
export function pickNextActivityIndex(
  items: ActivityFeedItem[],
  currentIndex: number,
  shownAt: Map<string, number>,
  nameCooldownMs: number,
): number {
  if (items.length <= 1) return 0;

  const now = Date.now();
  const currentType = items[currentIndex]?.type;

  for (let step = 1; step <= items.length; step++) {
    const idx = (currentIndex + step) % items.length;
    const item = items[idx]!;
    const key = activitySubjectKey(item);
    const lastShown = shownAt.get(key) ?? 0;
    const typeChanged = item.type !== currentType;
    if (now - lastShown >= nameCooldownMs && typeChanged) {
      shownAt.set(key, now);
      return idx;
    }
  }

  for (let step = 1; step <= items.length; step++) {
    const idx = (currentIndex + step) % items.length;
    const item = items[idx]!;
    const key = activitySubjectKey(item);
    const lastShown = shownAt.get(key) ?? 0;
    if (now - lastShown >= nameCooldownMs) {
      shownAt.set(key, now);
      return idx;
    }
  }

  let bestIdx = (currentIndex + 1) % items.length;
  let oldestShown = Infinity;
  for (let i = 0; i < items.length; i++) {
    const idx = (currentIndex + 1 + i) % items.length;
    const key = activitySubjectKey(items[idx]!);
    const lastShown = shownAt.get(key) ?? 0;
    if (lastShown < oldestShown) {
      oldestShown = lastShown;
      bestIdx = idx;
    }
  }
  shownAt.set(activitySubjectKey(items[bestIdx]!), now);
  return bestIdx;
}
