import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Unique Sky Way | Investment & Financial Services",
    template: "%s | Unique Sky Way",
  },
  description:
    "Unique Sky Way is a modern investment and financial services platform offering transparent portfolio management, secure transactions, and professional investor support.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://uniqueskyway.com",
  ),
  robots: {
    index: false,
    follow: false,
    nocache: true,
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
