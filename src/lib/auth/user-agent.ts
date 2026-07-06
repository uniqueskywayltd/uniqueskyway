/**
 * Parse user-agent into browser and OS labels for session display.
 */
export function parseUserAgent(userAgent: string | null | undefined): {
  browser: string;
  os: string;
  deviceLabel: string;
} {
  const ua = userAgent ?? "";

  let browser = "Unknown Browser";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/opera|opr\//i.test(ua)) browser = "Opera";

  let os = "Unknown OS";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  let deviceLabel = "desktop";
  if (/mobile|android|iphone/i.test(ua)) deviceLabel = "mobile";
  else if (/ipad|tablet/i.test(ua)) deviceLabel = "tablet";

  return { browser, os, deviceLabel };
}
