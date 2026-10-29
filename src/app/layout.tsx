import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Report Focus | Breaking News, Analysis and Video",
    template: "%s | Report Focus",
  },
  description:
    "Report Focus brings you breaking news, in-depth reporting and analysis on politics, the economy, the world, health, technology and sport.",
  openGraph: { siteName: "Report Focus", type: "website" },
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
};

export const viewport: Viewport = { themeColor: "#0a1a33" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
