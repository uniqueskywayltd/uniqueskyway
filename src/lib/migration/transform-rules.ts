const PLAN_SLUG_MAP: Record<string, string> = {
  "silver plan": "silver",
  silver: "silver",
  "gold plan": "gold",
  gold: "gold",
  "classic plan": "classic",
  classic: "classic",
  "master plan": "master",
  master: "master",
  "starter plan": "silver",
  starter: "silver",
};

export function mapLegacyPlanToSlug(plan: string): string | null {
  const normalized = plan.trim().toLowerCase();
  if (!normalized) return null;
  return PLAN_SLUG_MAP[normalized] ?? null;
}

export function extractReferrerUsername(refUrl: string): string | null {
  if (!refUrl) return null;
  const match = refUrl.match(/ref=([^&]+)/i);
  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]).trim() || null;
}

export function sanitizeAvatarFilename(filename: string): string | null {
  if (!filename) return null;
  const base = filename.split(/[/\\]/).pop()?.trim();
  if (!base) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(base)) return null;
  if (!/\.(jpe?g|png|gif|webp)$/i.test(base)) return null;
  return base;
}

export function migrationIdempotencyKey(
  entityType: string,
  legacyId: number,
): string {
  return `legacy-m9:${entityType}:${legacyId}`;
}

export function money(value: number): string {
  return value.toFixed(2);
}

/** First legacy user keeps the username; later duplicates get a stable suffix. */
export function buildUniqueUsernameMap(
  users: Array<{ uId: number; userName: string }>,
): Map<number, string> {
  const used = new Set<string>();
  const map = new Map<number, string>();
  const sorted = [...users].sort((a, b) => a.uId - b.uId);

  for (const user of sorted) {
    const base = user.userName.trim() || `user${user.uId}`;
    let candidate = base;
    let key = candidate.toLowerCase();

    if (used.has(key)) {
      candidate = `${base}_${user.uId}`;
      key = candidate.toLowerCase();
    }

    used.add(key);
    map.set(user.uId, candidate);
  }

  return map;
}
