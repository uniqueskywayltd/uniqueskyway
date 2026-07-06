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
