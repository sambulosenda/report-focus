import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ROBOTS, RSS_ALTERNATE, SHARE_IMAGE } from "@/lib/seo";
import { HOME_DESCRIPTION, HOME_TITLE, OG_LOCALE, TWITTER_HANDLE } from "@/lib/site";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

// Playfair for the masthead, Newsreader for headlines, Source Serif 4 for body text, Libre Franklin for UI.
// Headlines are Newsreader roman at weight 600. The italic cut and the variable weight range were
// preloaded as two files of about 140KB each, and those two requests were the slowest on a phone.
// The files are Google Fonts' latin subsets, kept in the repo so a build never depends on reaching Google.
const playfair = localFont({
  src: "../fonts/playfair-display-600.woff2",
  weight: "600",
  variable: "--font-playfair",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});
const headline = localFont({
  src: "../fonts/newsreader-600.woff2",
  weight: "600",
  variable: "--font-newsreader",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
const serif = localFont({
  src: [
    { path: "../fonts/source-serif-4.woff2", weight: "400 700", style: "normal" },
    { path: "../fonts/source-serif-4-italic.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-source-serif",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});
const sans = localFont({
  src: "../fonts/libre-franklin.woff2",
  weight: "400 800",
  variable: "--font-franklin",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: HOME_TITLE, template: "%s | Report Focus News" },
  description: HOME_DESCRIPTION,
  robots: ROBOTS,
  openGraph: { siteName: "Report Focus News", locale: OG_LOCALE, type: "website", images: [SHARE_IMAGE] },
  twitter: { card: "summary_large_image", site: TWITTER_HANDLE, images: [SHARE_IMAGE] },
  alternates: { types: RSS_ALTERNATE },
  // Proves to Google Search Console that this site belongs to the newsroom's account.
  verification: { google: "Ht1qagqS6RXNU4R7Z9y4Q0IGeht5_Nj0VlQY1g73pfE" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  appleWebApp: { title: "Report Focus" },
};

export const viewport: Viewport = { themeColor: "#004666" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${headline.variable} ${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
