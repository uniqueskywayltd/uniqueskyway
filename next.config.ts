import type { NextConfig } from "next";
import path from "path";

const privacyHeaders = [
  {
    key: "X-Robots-Tag",
    value:
      "noindex, nofollow, noarchive, nosnippet, noimageindex, nocache, unavailable_after: 2020-01-01",
  },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];

const nextConfig: NextConfig = {
  /** VPS-only minimal bundle — disabled for cPanel shared hosting (use build:cpanel). */
  ...(process.env.NEXT_OUTPUT_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  /** Shared hosting: avoid sharp/image optimizer memory spikes during build & runtime. */
  ...(process.env.NEXT_CPANEL === "1"
    ? { images: { unoptimized: true } }
    : {}),
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: privacyHeaders,
      },
    ];
  },
};

export default nextConfig;
