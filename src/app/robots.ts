import type { MetadataRoute } from "next";

const DISALLOW_ALL = [{ userAgent: "*", disallow: "/" as const }] as const;

const SEARCH_AND_AI_BOTS = [
  "Googlebot",
  "Googlebot-Image",
  "Googlebot-News",
  "Googlebot-Video",
  "Google-Extended",
  "AdsBot-Google",
  "Mediapartners-Google",
  "Bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "Applebot",
  "Applebot-Extended",
  "PetalBot",
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "CCBot",
  "anthropic-ai",
  "ClaudeBot",
  "PerplexityBot",
  "Bytespider",
  "Amazonbot",
  "FacebookBot",
  "ia_archiver",
  "archive.org_bot",
  "SeznamBot",
  "Sogou",
  "Exabot",
  "TelegramBot",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...DISALLOW_ALL,
      ...SEARCH_AND_AI_BOTS.map((userAgent) => ({
        userAgent,
        disallow: "/" as const,
      })),
    ],
  };
}
