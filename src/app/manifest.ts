import type { MetadataRoute } from "next";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Unique Sky Way";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appName,
    short_name: appName,
    description:
      "Investment and financial services platform with transparent portfolio management and secure client access.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/brand/favicon.webp",
        sizes: "32x32",
        type: "image/webp",
      },
      {
        src: "/brand/icon.webp",
        sizes: "176x176",
        type: "image/webp",
      },
      {
        src: "/brand/og-image.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
