import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Source_Serif_4 } from "next/font/google";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

// Three families only: Playfair for the masthead, Source Serif 4 for headlines and body, Inter for UI.
const playfair = Playfair_Display({ subsets: ["latin"], weight: "600", variable: "--font-playfair", display: "swap" });
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Report Focus News | Breaking News, Analysis and Video",
    template: "%s | Report Focus News",
  },
  description:
    "Report Focus News brings you breaking news, in-depth reporting and analysis on politics, the economy, the world, health, technology and sport.",
  openGraph: { siteName: "Report Focus News", type: "website" },
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
};

export const viewport: Viewport = { themeColor: "#004666" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${serif.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
