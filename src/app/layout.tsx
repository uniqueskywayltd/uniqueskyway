import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { resolveAppUrl } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Unique Sky Way";
const appDescription =
  "Investment and financial services platform with transparent portfolio management and secure client access.";

export const metadata: Metadata = {
  title: {
    default: `${appName} | Investment & Financial Services`,
    template: `%s | ${appName}`,
  },
  description: appDescription,
  metadataBase: new URL(resolveAppUrl()),
  applicationName: appName,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noimageindex: true,
    noarchive: true,
    nosnippet: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
      nosnippet: true,
    },
  },
  icons: {
    icon: [
      { url: "/brand/favicon.webp", sizes: "32x32", type: "image/webp" },
      { url: "/brand/icon.webp", sizes: "176x176", type: "image/webp" },
    ],
    apple: "/brand/icon.webp",
  },
  openGraph: {
    type: "website",
    siteName: appName,
    title: appName,
    description: appDescription,
    images: [
      {
        url: "/brand/og-image.png",
        width: 512,
        height: 512,
        alt: `${appName} logo`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: appName,
    description: appDescription,
    images: ["/brand/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
