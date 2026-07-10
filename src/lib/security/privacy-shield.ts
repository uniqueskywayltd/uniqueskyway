/**
 * Privacy shield — blocks search engines, crawlers, and enforces link-only access.
 */

/** Search engine and aggressive crawler user-agent patterns */
const BLOCKED_CRAWLER_PATTERNS = [
  /googlebot/i,
  /google-inspectiontool/i,
  /googleother/i,
  /google-extended/i,
  /storebot-google/i,
  /bingbot/i,
  /msnbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /applebot/i,
  /petalbot/i,
  /ahrefsbot/i,
  /semrushbot/i,
  /mj12bot/i,
  /dotbot/i,
  /rogerbot/i,
  /screaming frog/i,
  /seznambot/i,
  /sogou/i,
  /exabot/i,
  /ia_archiver/i,
  /archive\.org_bot/i,
  /ccbot/i,
  /gptbot/i,
  /chatgpt-user/i,
  /claudebot/i,
  /anthropic-ai/i,
  /perplexitybot/i,
  /bytespider/i,
  /amazonbot/i,
  /facebookcatalog/i,
] as const;

/** Link-preview fetchers (Telegram, WhatsApp, etc.) — allowed for OG metadata only */
const SOCIAL_PREVIEW_BOT_PATTERNS = [
  /facebookexternalhit/i,
  /facebot/i,
  /meta-externalagent/i,
  /whatsapp/i,
  /telegrambot/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /discordbot/i,
  /skypeuripreview/i,
  /vkshare/i,
  /embedly/i,
  /pinterestbot/i,
  /redditbot/i,
] as const;

/** Generic bot patterns — blocked unless explicitly allowed */
const GENERIC_BOT_PATTERNS = [
  /bot\b/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl\//i,
  /wget\//i,
  /python-requests/i,
  /go-http-client/i,
  /java\//i,
  /libwww-perl/i,
  /headlesschrome/i,
  /phantomjs/i,
] as const;

/** Allowed bots — social preview fetchers only (not search indexers) */
const ALLOWED_BOT_PATTERNS: RegExp[] = [...SOCIAL_PREVIEW_BOT_PATTERNS];

export const PRIVACY_HEADERS: Record<string, string> = {
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex, nocache, unavailable_after: 2020-01-01",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

export const ACCESS_COOKIE_NAME = "usw_access";
export const ACCESS_QUERY_PARAM = "access";

const GATE_EXEMPT_PATHS = new Set([
  "/robots.txt",
  "/api/health",
]);

const GATE_EXEMPT_PREFIXES = [
  "/api/auth/",
  "/api/cron/",
  "/api/hard/auth/",
  "/hard/auth/",
  "/api/activity-feed",
  "/api/market-ticker",
] as const;

export function isGateExemptPath(pathname: string): boolean {
  if (GATE_EXEMPT_PATHS.has(pathname)) return true;
  return GATE_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function isSocialPreviewBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return SOCIAL_PREVIEW_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/** Public marketing pages that may return link-preview metadata to social bots */
export function isPublicPreviewPath(pathname: string): boolean {
  if (pathname === "/") return true;
  const publicPrefixes = [
    "/about",
    "/contact",
    "/faq",
    "/how-it-works",
    "/investments",
    "/privacy",
    "/referrals",
    "/security",
    "/services",
    "/terms",
  ];
  return publicPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isBlockedCrawler(userAgent: string | null): boolean {
  if (!userAgent) return true;

  for (const pattern of ALLOWED_BOT_PATTERNS) {
    if (pattern.test(userAgent)) return false;
  }

  for (const pattern of BLOCKED_CRAWLER_PATTERNS) {
    if (pattern.test(userAgent)) return true;
  }

  for (const pattern of GENERIC_BOT_PATTERNS) {
    if (pattern.test(userAgent)) return true;
  }

  return false;
}

export function isAccessGateEnabled(): boolean {
  return Boolean(process.env.SITE_ACCESS_KEY?.trim());
}

export function isAccessGateRequired(host: string | null): boolean {
  if (!isAccessGateEnabled()) return false;
  if (!host) return true;

  const normalized = host.toLowerCase();
  return (
    !normalized.startsWith("localhost") &&
    !normalized.startsWith("127.0.0.1") &&
    !normalized.endsWith(".local")
  );
}

export function isValidAccessToken(provided: string | null | undefined): boolean {
  const expected = process.env.SITE_ACCESS_KEY?.trim();
  if (!expected || !provided) return false;
  return timingSafeEqualStrings(provided, expected);
}

export function hasValidAccessCookie(cookieValue: string | null | undefined): boolean {
  return isValidAccessToken(cookieValue);
}

export function buildShareableUrl(baseUrl: string, accessKey: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set(ACCESS_QUERY_PARAM, accessKey);
  return url.toString();
}
